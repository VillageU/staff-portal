import { supabase } from './supabase';
import type { InteractionMCM, SCITier, SCITrend } from './supabase';

interface ConnectionGroup {
  connection_key: string;
  positive_count: number;
  first_date: string;
  last_date: string;
}

export async function calculateEstablishedConnections(
  studentId: string,
  domain: 'P2P' | 'S2S'
): Promise<number> {
  const { data: interactions } = await supabase
    .from('interactions_mcm')
    .select('*')
    .eq('student_id', studentId)
    .eq('domain', domain)
    .eq('is_positive', true);

  if (!interactions || interactions.length === 0) {
    return 0;
  }

  const connectionGroups: { [key: string]: ConnectionGroup } = {};

  interactions.forEach((interaction: InteractionMCM) => {
    const key = interaction.related_key || 'unknown';
    if (!connectionGroups[key]) {
      connectionGroups[key] = {
        connection_key: key,
        positive_count: 0,
        first_date: interaction.date,
        last_date: interaction.date,
      };
    }
    connectionGroups[key].positive_count++;
    if (interaction.date < connectionGroups[key].first_date) {
      connectionGroups[key].first_date = interaction.date;
    }
    if (interaction.date > connectionGroups[key].last_date) {
      connectionGroups[key].last_date = interaction.date;
    }
  });

  await Promise.all(
    Object.values(connectionGroups).map(async (group) => {
      const isEstablished = group.positive_count >= 3;

      await supabase
        .from('established_connections')
        .upsert({
          student_id: studentId,
          domain,
          connection_key: group.connection_key,
          positive_interaction_count: group.positive_count,
          first_interaction_date: group.first_date,
          last_interaction_date: group.last_date,
          is_established: isEstablished,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'student_id,domain,connection_key'
        });
    })
  );

  const establishedCount = Object.values(connectionGroups).filter(
    (g) => g.positive_count >= 3
  ).length;

  return establishedCount;
}

export function calculateP2PScore(establishedPeers: number): number {
  if (establishedPeers === 0) return 0;
  if (establishedPeers <= 2) return 4;
  if (establishedPeers <= 4) return 7;
  return 10;
}

export function calculateS2SScore(establishedStaff: number): number {
  if (establishedStaff === 0) return 0;
  if (establishedStaff === 1) return 6;
  return 10;
}

export async function calculateCCScore(studentId: string): Promise<number> {
  const { data: ccInteractions } = await supabase
    .from('interactions_mcm')
    .select('*')
    .eq('student_id', studentId)
    .eq('domain', 'CC')
    .order('date', { ascending: true });

  if (!ccInteractions || ccInteractions.length === 0) {
    await supabase
      .from('co_curricular_consistency')
      .upsert({
        student_id: studentId,
        meets_threshold: false,
        threshold_basis: null,
        last_evidence_date: null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'student_id'
      });
    return 0;
  }

  const months = new Set<string>();
  const categories = new Set<string>();

  ccInteractions.forEach((interaction: InteractionMCM) => {
    const date = new Date(interaction.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    months.add(monthKey);

    if (interaction.subtype) {
      categories.add(interaction.subtype.toLowerCase());
    }
  });

  const meetsMultiTimepoint = months.size >= 2;
  const meetsMultiCategory = categories.size >= 2;
  const meetsThreshold = meetsMultiTimepoint || meetsMultiCategory;

  const lastInteraction = ccInteractions[ccInteractions.length - 1];
  const thresholdBasis = meetsMultiTimepoint
    ? `Multi-timepoint (${months.size} different months)`
    : meetsMultiCategory
    ? `Multi-category (${categories.size} different types)`
    : 'Does not meet threshold';

  await supabase
    .from('co_curricular_consistency')
    .upsert({
      student_id: studentId,
      meets_threshold: meetsThreshold,
      threshold_basis: thresholdBasis,
      last_evidence_date: lastInteraction.date,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'student_id'
    });

  return meetsThreshold ? 10 : 0;
}

export function calculateTotalSCI(p2pScore: number, s2sScore: number, ccScore: number): number {
  return p2pScore + s2sScore + ccScore;
}

export function determineTier(totalScore: number): SCITier {
  if (totalScore >= 22) return 'strong';
  if (totalScore >= 12) return 'partial';
  return 'limited';
}

export async function calculateTrend(studentId: string, currentTotal: number): Promise<SCITrend> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: historicalScore } = await supabase
    .from('student_sci_history')
    .select('total_score')
    .eq('student_id', studentId)
    .gte('snapshot_date', thirtyDaysAgo.toISOString())
    .order('snapshot_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!historicalScore) {
    return 'unknown';
  }

  const diff = currentTotal - historicalScore.total_score;

  if (diff >= 3) return 'improving';
  if (diff <= -3) return 'declining';
  return 'stable';
}

export async function recalculateSCIForStudent(studentId: string): Promise<void> {
  const establishedPeers = await calculateEstablishedConnections(studentId, 'P2P');
  const establishedStaff = await calculateEstablishedConnections(studentId, 'S2S');

  const p2pScore = calculateP2PScore(establishedPeers);
  const s2sScore = calculateS2SScore(establishedStaff);
  const ccScore = await calculateCCScore(studentId);

  const totalScore = calculateTotalSCI(p2pScore, s2sScore, ccScore);
  const tier = determineTier(totalScore);
  const trend = await calculateTrend(studentId, totalScore);

  const { data: latestInteraction } = await supabase
    .from('interactions_mcm')
    .select('date')
    .eq('student_id', studentId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const now = new Date().toISOString();

  await supabase
    .from('student_sci')
    .upsert({
      student_id: studentId,
      p2p_score: p2pScore,
      s2s_score: s2sScore,
      cc_score: ccScore,
      total_score: totalScore,
      tier,
      trend,
      last_meaningful_signal_date: latestInteraction?.date || null,
      calculated_at: now,
    }, {
      onConflict: 'student_id'
    });

  await supabase
    .from('student_sci_history')
    .insert({
      student_id: studentId,
      snapshot_date: now,
      total_score: totalScore,
      p2p_score: p2pScore,
      s2s_score: s2sScore,
      cc_score: ccScore,
    });
}
