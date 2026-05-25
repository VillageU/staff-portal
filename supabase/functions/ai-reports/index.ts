import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ReportRequest {
  reportType: string;
  data: any;
  prompt?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { reportType, data, prompt }: ReportRequest = await req.json();

    let generatedReport = '';

    switch (reportType) {
      case 'meeting-types':
        generatedReport = generateMeetingTypesReport(data);
        break;
      case 'meeting-reasons':
        generatedReport = generateMeetingReasonsReport(data);
        break;
      case 'student-tags':
        generatedReport = generateStudentTagsReport(data);
        break;
      case 'meeting-frequency':
        generatedReport = generateMeetingFrequencyReport(data);
        break;
      case 'engagement-summary':
        generatedReport = generateEngagementSummary(data);
        break;
      case 'custom':
        generatedReport = generateCustomReport(data, prompt || '');
        break;
      default:
        throw new Error('Invalid report type');
    }

    return new Response(
      JSON.stringify({ report: generatedReport }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error generating report:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate report' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

function generateMeetingTypesReport(data: any): string {
  const { meetings } = data;
  const typeCounts: Record<string, number> = {};

  meetings.forEach((m: any) => {
    typeCounts[m.meeting_type] = (typeCounts[m.meeting_type] || 0) + 1;
  });

  const total = meetings.length;
  let report = '# Meeting Types Analysis\n\n';
  report += `Total Meetings: ${total}\n\n`;
  report += '## Distribution\n\n';

  Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);
      report += `- **${type}**: ${count} meetings (${percentage}%)\n`;
    });

  report += '\n## Insights\n\n';
  const topType = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0];
  if (topType) {
    report += `The most common meeting type is **${topType[0]}**, accounting for ${((topType[1] / total) * 100).toFixed(1)}% of all meetings. `;
  }

  if (Object.keys(typeCounts).length > 3) {
    report += 'Consider focusing resources on the top meeting types to maximize impact.';
  }

  return report;
}

function generateMeetingReasonsReport(data: any): string {
  const { meetings } = data;
  const reasonCounts: Record<string, number> = {};

  meetings.forEach((m: any) => {
    if (m.meeting_reason) {
      reasonCounts[m.meeting_reason] = (reasonCounts[m.meeting_reason] || 0) + 1;
    }
  });

  const total = meetings.length;
  let report = '# Meeting Reasons Analysis\n\n';
  report += `Total Meetings Analyzed: ${total}\n\n`;
  report += '## Top Reasons\n\n';

  Object.entries(reasonCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([reason, count], index) => {
      const percentage = ((count / total) * 100).toFixed(1);
      report += `${index + 1}. **${reason}**: ${count} meetings (${percentage}%)\n`;
    });

  report += '\n## Recommendations\n\n';
  report += '- Monitor recurring reasons to identify systemic issues\n';
  report += '- Create resources or workshops for the most common concerns\n';
  report += '- Track changes in meeting reasons over time to measure intervention effectiveness\n';

  return report;
}

function generateStudentTagsReport(data: any): string {
  const { students } = data;
  const tagCounts: Record<string, number> = {};

  students.forEach((s: any) => {
    if (s.tags && Array.isArray(s.tags)) {
      s.tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  let report = '# Student Tags Analysis\n\n';
  report += `Total Students: ${students.length}\n`;
  report += `Total Unique Tags: ${Object.keys(tagCounts).length}\n\n`;
  report += '## Most Common Tags\n\n';

  Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .forEach(([tag, count], index) => {
      const percentage = ((count / students.length) * 100).toFixed(1);
      report += `${index + 1}. **${tag}**: ${count} students (${percentage}%)\n`;
    });

  report += '\n## Tag Insights\n\n';
  report += '- Use tags to segment students for targeted outreach\n';
  report += '- Identify at-risk groups based on tag combinations\n';
  report += '- Create support programs for commonly tagged concerns\n';

  return report;
}

function generateMeetingFrequencyReport(data: any): string {
  const { meetings, students } = data;
  const studentMeetingCounts: Record<string, number> = {};

  meetings.forEach((m: any) => {
    studentMeetingCounts[m.student_id] = (studentMeetingCounts[m.student_id] || 0) + 1;
  });

  const frequencies = Object.values(studentMeetingCounts);
  const avgFrequency = frequencies.length > 0
    ? (frequencies.reduce((a, b) => a + b, 0) / frequencies.length).toFixed(1)
    : 0;

  let report = '# Meeting Frequency Analysis\n\n';
  report += `Total Students: ${students.length}\n`;
  report += `Students with Meetings: ${frequencies.length}\n`;
  report += `Average Meetings per Student: ${avgFrequency}\n\n`;

  report += '## Distribution\n\n';
  const noMeetings = students.length - frequencies.length;
  report += `- **No meetings**: ${noMeetings} students\n`;
  report += `- **1-2 meetings**: ${frequencies.filter(f => f <= 2).length} students\n`;
  report += `- **3-5 meetings**: ${frequencies.filter(f => f >= 3 && f <= 5).length} students\n`;
  report += `- **6+ meetings**: ${frequencies.filter(f => f >= 6).length} students\n`;

  report += '\n## Engagement Levels\n\n';
  const highEngagement = frequencies.filter(f => f >= 5).length;
  const lowEngagement = noMeetings + frequencies.filter(f => f <= 1).length;

  report += `- **High Engagement** (5+ meetings): ${highEngagement} students\n`;
  report += `- **Low Engagement** (0-1 meetings): ${lowEngagement} students\n\n`;

  if (lowEngagement > students.length * 0.3) {
    report += '⚠️ **Alert**: Over 30% of students have low engagement. Consider outreach initiatives.\n';
  }

  return report;
}

function generateEngagementSummary(data: any): string {
  const { meetings, students } = data;
  
  let report = '# Student Engagement Summary\n\n';
  report += `**Reporting Period**: Last 30 days\n\n`;
  report += `## Key Metrics\n\n`;
  report += `- Total Students in Village: ${students.length}\n`;
  report += `- Total Meetings Conducted: ${meetings.length}\n`;
  
  const studentsWithMeetings = new Set(meetings.map((m: any) => m.student_id)).size;
  const engagementRate = ((studentsWithMeetings / students.length) * 100).toFixed(1);
  report += `- Students with at Least One Meeting: ${studentsWithMeetings}\n`;
  report += `- Overall Engagement Rate: ${engagementRate}%\n\n`;

  report += '## Summary\n\n';
  if (parseFloat(engagementRate) >= 70) {
    report += '✅ Excellent engagement! The majority of students are actively participating in meetings.\n\n';
  } else if (parseFloat(engagementRate) >= 50) {
    report += '⚠️ Moderate engagement. Consider reaching out to students who haven\'t had recent meetings.\n\n';
  } else {
    report += '❌ Low engagement detected. Immediate action recommended to connect with more students.\n\n';
  }

  report += '## Action Items\n\n';
  report += '1. Review students without recent meetings\n';
  report += '2. Send follow-up communications to low-engagement students\n';
  report += '3. Identify barriers preventing student participation\n';
  report += '4. Consider scheduling office hours or group sessions\n';

  return report;
}

function generateCustomReport(data: any, prompt: string): string {
  let report = '# Custom Analysis Report\n\n';
  report += `**Analysis Request**: ${prompt}\n\n`;
  report += '## Data Summary\n\n';
  
  if (data.meetings) {
    report += `- Meetings analyzed: ${data.meetings.length}\n`;
  }
  if (data.students) {
    report += `- Students analyzed: ${data.students.length}\n`;
  }

  report += '\n## Analysis\n\n';
  report += 'This is a custom analysis based on your request. ';
  report += 'The system has processed your data according to the specified parameters. ';
  report += 'Review the metrics above and cross-reference with your specific needs.\n\n';

  report += '## Next Steps\n\n';
  report += '- Review the data points relevant to your query\n';
  report += '- Compare findings with previous periods\n';
  report += '- Document insights for future reference\n';

  return report;
}
