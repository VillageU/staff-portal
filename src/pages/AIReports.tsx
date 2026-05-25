import React, { useEffect, useMemo, useState } from "react";
import { Brain, Download, TrendingUp, RotateCcw } from "lucide-react";
import { supabase, StudentWithSCI, StudentSegmentCatalog } from "../lib/supabase";
import * as XLSX from "xlsx";
import { MultiSelect } from "../components/MultiSelect";

type SortKey = "name" | "gpa" | "sci";

const avg = (nums: number[]): number => {
  if (nums.length === 0) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
};

const getSegmentLabels = (
  segmentNames: string[] | undefined | null,
  segments: StudentSegmentCatalog[]
): string[] => {
  if (!segmentNames || segmentNames.length === 0) return [];
  return segmentNames
    .map((name) => segments.find((s) => s.name === name)?.label || name)
    .filter(Boolean);
};

const formatSegmentsDisplay = (
  segmentLabels: string[],
  shareWithStaff: boolean | undefined
): string => {
  if (shareWithStaff === false) return "Not Shared";
  if (segmentLabels.length === 0) return "—";
  if (segmentLabels.length === 1) return segmentLabels[0];
  return `${segmentLabels[0]} +${segmentLabels.length - 1} more`;
};

// Helper Components
const SummaryCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-gray-50 border rounded-lg p-4">
    <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">{label}</div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
  </div>
);

const StatusBadge: React.FC<{ sci: number }> = ({ sci }) => {
  if (sci <= 15) {
    return <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700">Limited</span>;
  }
  if (sci <= 30) {
    return <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">Partial</span>;
  }
  return <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">Strong</span>;
};

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
    {children}
  </th>
);

const Td: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <td className={`px-4 py-3 ${className}`}>{children}</td>
);

export const AIReports: React.FC = () => {
  const [students, setStudents] = useState<StudentWithSCI[]>([]);
  const [generatedReport, setGeneratedReport] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [gpaMin, setGpaMin] = useState<number | undefined>();
  const [gpaMax, setGpaMax] = useState<number | undefined>();
  const [sciThreshold, setSciThreshold] = useState<number>(30);
  const [sortBy, setSortBy] = useState<SortKey>("sci");

  const [majors, setMajors] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [segments, setSegments] = useState<StudentSegmentCatalog[]>([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);

        const [studentsResult, segmentsResult] = await Promise.all([
          supabase
            .from("students")
            .select(`
              *,
              sci:student_sci ( total_score ),
              student_staff_metadata ( student_segments, share_with_staff )
            `),
          supabase
            .from("student_segments_catalog")
            .select("*")
            .eq("is_active", true)
            .order("label")
        ]);

        if (studentsResult.error) throw studentsResult.error;
        if (segmentsResult.error) throw segmentsResult.error;

        const studentsData = studentsResult.data || [];
        const processedStudents = studentsData.map((student: any) => ({
          ...student,
          student_staff_metadata: Array.isArray(student.student_staff_metadata)
            ? student.student_staff_metadata[0]
            : student.student_staff_metadata
        }));

        setStudents(processedStudents);
        setSegments(segmentsResult.data || []);

        setMajors([...new Set(studentsData?.map(s => s.major).filter(Boolean))]);
        setYears([...new Set(studentsData?.map(s => s.year).filter(Boolean))]);
      } catch (err) {
        console.error(err);
        setError("Failed to load student data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        const metadata = s.student_staff_metadata;
        const studentSegments = metadata?.student_segments || [];
        const shareWithStaff = metadata?.share_with_staff !== false;

        let segmentMatch = true;
        if (selectedSegments.length > 0) {
          const hasNoSegment = selectedSegments.includes("__NO_SEGMENT__");
          const otherSegments = selectedSegments.filter(seg => seg !== "__NO_SEGMENT__");

          const studentHasNoSegment = !shareWithStaff || studentSegments.length === 0;

          if (hasNoSegment && otherSegments.length > 0) {
            segmentMatch = studentHasNoSegment ||
              otherSegments.some(seg => studentSegments.includes(seg));
          } else if (hasNoSegment) {
            segmentMatch = studentHasNoSegment;
          } else {
            segmentMatch = shareWithStaff &&
              otherSegments.some(seg => studentSegments.includes(seg));
          }
        }

        return (
          (!selectedMajor || s.major === selectedMajor) &&
          (!selectedYear || s.year === selectedYear) &&
          segmentMatch &&
          (gpaMin === undefined || (s.gpa ?? 0) >= gpaMin) &&
          (gpaMax === undefined || (s.gpa ?? 0) <= gpaMax) &&
          ((s.sci?.total_score ?? 0) <= sciThreshold)
        );
      })
      .sort((a, b) => {
        if (sortBy === "name")
          return (a.full_name ?? "").localeCompare(b.full_name ?? "");
        if (sortBy === "gpa") return (a.gpa ?? 0) - (b.gpa ?? 0);
        return (a.sci?.total_score ?? 0) - (b.sci?.total_score ?? 0);
      });
  }, [
    students,
    selectedMajor,
    selectedYear,
    selectedSegments,
    gpaMin,
    gpaMax,
    sciThreshold,
    sortBy,
  ]);

  const resetFilters = () => {
    setSelectedMajor("");
    setSelectedYear("");
    setSelectedSegments([]);
    setGpaMin(undefined);
    setGpaMax(undefined);
    setSciThreshold(30);
    setSortBy("sci");
  };

  const handleGenerateReport = () => {
    if (!filteredStudents.length) return;

    const report = filteredStudents.map((s) => {
      const metadata = s.student_staff_metadata;
      const segmentLabels = getSegmentLabels(metadata?.student_segments, segments);
      const shareWithStaff = metadata?.share_with_staff !== false;
      const segmentsText = !shareWithStaff
        ? "Not Shared"
        : segmentLabels.length > 0
        ? segmentLabels.join(", ")
        : "None";

      return `- ${s.full_name || `${s.first_name} ${s.last_name}`} | Major: ${
        s.major
      }, Year: ${s.year}, Segments: ${segmentsText}, GPA: ${
        s.gpa ?? "N/A"
      }, SCI: ${s.sci?.total_score ?? 0}`;
    });

    setGeneratedReport(`# Connectivity Report\n\n${report.join("\n")}`);
  };

  const handleDownloadCSV = () => {
    const rows = filteredStudents.map((s) => {
      const metadata = s.student_staff_metadata;
      const segmentLabels = getSegmentLabels(metadata?.student_segments, segments);
      const shareWithStaff = metadata?.share_with_staff !== false;

      return {
        Name: s.full_name || `${s.first_name} ${s.last_name}`,
        Major: s.major,
        Year: s.year,
        Segments: !shareWithStaff ? "Not Shared" : segmentLabels.join(", ") || "",
        GPA: s.gpa ?? "",
        SCI: s.sci?.total_score ?? 0,
      };
    });

    const csv =
      [Object.keys(rows[0]).join(","), ...rows.map((r) => Object.values(r).join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `students-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleDownloadXLS = () => {
    const rows = filteredStudents.map((s) => {
      const metadata = s.student_staff_metadata;
      const segmentLabels = getSegmentLabels(metadata?.student_segments, segments);
      const shareWithStaff = metadata?.share_with_staff !== false;

      return {
        Name: s.full_name || `${s.first_name} ${s.last_name}`,
        Major: s.major,
        Year: s.year,
        Segments: !shareWithStaff ? "Not Shared" : segmentLabels.join(", ") || "",
        GPA: s.gpa ?? "",
        SCI: s.sci?.total_score ?? 0,
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 26 },
      { wch: 18 },
      { wch: 10 },
      { wch: 30 },
      { wch: 10 },
      { wch: 10 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `students-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) return <p className="p-6">Loading students...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <TrendingUp className="w-6 h-6" /> Student Connectivity Reports
      </h1>

      {/* Filters */}
      <div className="grid md:grid-cols-4 gap-4">
        <select value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)} className="border p-2 rounded">
          <option value="">All Majors</option>
          {majors.map((m) => <option key={m}>{m}</option>)}
        </select>

        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="border p-2 rounded">
          <option value="">All Years</option>
          {years.map((y) => <option key={y}>{y}</option>)}
        </select>

        <MultiSelect
          options={[
            { value: "__NO_SEGMENT__", label: "No Segment" },
            ...segments.map((s) => ({ value: s.name, label: s.label }))
          ]}
          selected={selectedSegments}
          onChange={setSelectedSegments}
          placeholder="Student Segments"
        />

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="border p-2 rounded">
          <option value="sci">Sort by SCI</option>
          <option value="gpa">Sort by GPA</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <input type="number" placeholder="GPA Min" value={gpaMin ?? ""} onChange={(e) => setGpaMin(e.target.value ? Number(e.target.value) : undefined)} className="border p-2 rounded" />
        <input type="number" placeholder="GPA Max" value={gpaMax ?? ""} onChange={(e) => setGpaMax(e.target.value ? Number(e.target.value) : undefined)} className="border p-2 rounded" />
        <input type="number" placeholder="SCI Threshold" value={sciThreshold} onChange={(e) => setSciThreshold(Number(e.target.value))} className="border p-2 rounded" />
        <button onClick={resetFilters} className="border rounded flex items-center justify-center gap-2">
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
      </div>

      <div className="flex gap-3">
        <button onClick={handleGenerateReport} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
          <Brain className="w-5 h-5" /> Generate Report
        </button>
        <button onClick={handleDownloadCSV} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
          <Download className="w-5 h-5" /> CSV
        </button>
        <button onClick={handleDownloadXLS} className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-2">
          <Download className="w-5 h-5" /> Excel
        </button>
      </div>

   {filteredStudents.length > 0 && (
  <div className="bg-white rounded-lg shadow border p-5 space-y-4">

    {/* Summary Row */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <SummaryCard label="Students" value={filteredStudents.length} />
      <SummaryCard label="Avg GPA" value={avg(filteredStudents.map(s => s.gpa ?? 0)).toFixed(2)} />
      <SummaryCard label="Avg SCI" value={avg(filteredStudents.map(s => s.sci?.total_score ?? 0)).toFixed(1)} />
      <SummaryCard label="Priority Outreach" value={filteredStudents.filter(s => (s.sci?.total_score ?? 0) <= 20).length} />
    </div>

    {/* Data Table */}
    <div className="overflow-x-auto rounded border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 border-b">
          <tr>
            <Th>Name</Th>
            <Th>Major</Th>
            <Th>Year</Th>
            <Th>Segments</Th>
            <Th>GPA</Th>
            <Th>SCI</Th>
            <Th>Status</Th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {filteredStudents.map((s) => {
            const sci = s.sci?.total_score ?? 0;
            const metadata = s.student_staff_metadata;
            const segmentLabels = getSegmentLabels(metadata?.student_segments, segments);
            const segmentsDisplay = formatSegmentsDisplay(
              segmentLabels,
              metadata?.share_with_staff
            );
            const allSegments = segmentLabels.join(", ");

            return (
              <tr key={s.id} className="hover:bg-gray-50">
                <Td className="font-medium">{s.full_name}</Td>
                <Td>{s.major}</Td>
                <Td>{s.year}</Td>
                <Td>
                  <span title={allSegments} className="cursor-help">
                    {segmentsDisplay}
                  </span>
                </Td>
                <Td>{s.gpa?.toFixed(2) ?? "N/A"}</Td>
                <Td>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${sci <= 15 ? "bg-red-100 text-red-700" : sci <= 30 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-700"}`}>
                    {sci}
                  </span>
                </Td>
                <Td>
                  <StatusBadge sci={sci} />
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
)}


      <p className="text-sm text-gray-600">
        {filteredStudents.length} students matched
      </p>
    </div>
  );
};
