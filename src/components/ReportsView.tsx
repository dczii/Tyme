'use client';

import React, { useState, useMemo } from "react";
import {
  Filter,
  Calendar,
  Tag as TagIcon,
  Folder,
  Search,
  Download,
  Printer,
  RotateCcw,
  Copy,
  Trash2,
  Sparkles,
  BarChart2,
  TrendingUp,
  FileSpreadsheet,
  Plus,
  DollarSign,
} from "lucide-react";
import { TimeEntry, Project, Tag as TagType, ReportFilter } from "../types";
import {
  formatMinutesHHMM,
  formatMinutesDecimal,
  exportToCSV,
  formatDateFriendly,
  calculateDurationMinutes,
  getPresetDateRange,
} from "../utils";
import BrandLogo from "./BrandLogo";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

// Predefined filtering options
type PresetFilterType = "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "allTime";

interface ReportsViewProps {
  entries: TimeEntry[];
  projects: Project[];
  tags: TagType[];
  onDeleteEntry: (id: string) => void;
  onDuplicateEntry: (entry: TimeEntry) => void;
  hourlyRate: number;
}

export default function ReportsView({
  entries,
  projects,
  tags,
  onDeleteEntry,
  onDuplicateEntry,
  hourlyRate,
}: ReportsViewProps) {
  // Preset select
  const [datePreset, setDatePreset] = useState<PresetFilterType>("thisMonth");

  // Custom dates
  const [customStart, setCustomStart] = useState<string>("2026-06-01");
  const [customEnd, setCustomEnd] = useState<string>("2026-06-30");

  // Filter criteria options
  const [selectedProjId, setSelectedProjId] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [roundingActive, setRoundingActive] = useState<boolean>(false);

  // Rounding helper - rounds to nearest 15 mins (0.25h) when active, standard for professional workspaces
  const getDisplayMinutes = (mins: number) => {
    if (!roundingActive) return mins;
    return Math.max(15, Math.round(mins / 15) * 15);
  };

  // 1. Filter Logic
  const filteredEntries = useMemo(() => {
    // Determine start and end ranges based on presets (relative to today)
    const { minDateStr, maxDateStr } = getPresetDateRange(datePreset);

    return entries
      .filter((entry) => {
        // Range validation
        const d = entry.date;
        if (minDateStr && maxDateStr) {
          if (d < minDateStr || d > maxDateStr) return false;
        }

        // Project filter
        if (selectedProjId && entry.projectId !== selectedProjId) return false;

        // Tag filter
        if (selectedTag && !entry.tags.includes(selectedTag)) return false;

        // Search keyword filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const descMatch = entry.description.toLowerCase().includes(query);
          const tagsMatch = entry.tags.some((t) => t.toLowerCase().includes(query));
          if (!descMatch && !tagsMatch) return false;
        }

        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date)); // Sort by newest date first
  }, [entries, datePreset, selectedProjId, selectedTag, searchQuery]);

  // 2. Metrics aggregates
  const totalMinutes = useMemo(() => {
    return filteredEntries.reduce((acc, curr) => acc + getDisplayMinutes(curr.durationMinutes), 0);
  }, [filteredEntries, roundingActive]);

  const distinctDaysCount = useMemo(() => {
    const daysSet = new Set(filteredEntries.map((e) => e.date));
    return Math.max(1, daysSet.size);
  }, [filteredEntries]);

  const averageHoursPerDay = useMemo(() => {
    const totalHours = totalMinutes / 60;
    return totalHours / distinctDaysCount;
  }, [totalMinutes, distinctDaysCount]);

  // Project distribution matching custom donut charts
  const projectAggregates = useMemo(() => {
    const map: Record<string, { mins: number; color: string; name: string }> = {};

    filteredEntries.forEach((entry) => {
      const projId = entry.projectId || "unassigned";
      const proj = projects.find((p) => p.id === projId);
      const name = proj ? proj.name : "No Project";
      const color = proj ? proj.color : "#64748b"; // slate

      if (!map[projId]) {
        map[projId] = { mins: 0, color, name };
      }
      map[projId].mins += getDisplayMinutes(entry.durationMinutes);
    });

    return Object.values(map).sort((a, b) => b.mins - a.mins);
  }, [filteredEntries, projects, roundingActive]);

  // Day distribution for Custom Bar Chart
  const dailyDistribution = useMemo(() => {
    const map: Record<string, number> = {};

    // Sort and aggregate daily logs
    filteredEntries.forEach((entry) => {
      map[entry.date] = (map[entry.date] || 0) + getDisplayMinutes(entry.durationMinutes);
    });

    const dates = Object.keys(map).sort();
    return dates
      .map((dt) => {
        const parts = dt.split("-");
        const monthFriendly = parts[1] === "06" ? "Jun" : parts[1] === "05" ? "May" : "Date";
        return {
          label: `${monthFriendly} ${parts[2]}`,
          mins: map[dt],
        };
      })
      .slice(-12); // Display last 12 active logging days to keep chart beautiful on all screens
  }, [filteredEntries, roundingActive]);

  // Generate and download a highly polished professional PDF report from data (matching Tyme style)
  const handlePrintPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageHeight = doc.internal.pageSize.getHeight(); // ~841.89 pt
    const pageWidth = doc.internal.pageSize.getWidth(); // ~595.28 pt
    const margin = 45;
    const contentWidth = pageWidth - margin * 2; // ~505.28 pt

    let posY = 50;
    let pageNum = 1;

    // Standard Tyme page footer drawer
    const drawPageFooter = (num: number) => {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(110, 110, 110);
      const footerY = pageHeight - 30;
      doc.text("Dczii's workspace", margin, footerY);
      doc.text("Created with Tyme", pageWidth / 2, footerY, { align: "center" });
      doc.text(String(num), pageWidth - margin, footerY, { align: "right" });
    };

    // Vector drawing helper for perfectly smooth donut charts
    const drawDonut = (
      cx: number,
      cy: number,
      rOuter: number,
      rInner: number,
      segmentsList: any[],
      centerTxt: string,
    ) => {
      let currentAngle = -Math.PI / 2; // Start from top
      const totalSecMins = segmentsList.reduce((sum, s) => sum + s.mins, 0);
      if (totalSecMins === 0) return;

      // Draw colored sectors using high precision radial triangle sweeps
      segmentsList.forEach((seg) => {
        const pct = seg.mins / totalSecMins;
        const angleSweep = pct * Math.PI * 2;

        const hexColor = seg.color || "#0288d1";
        const r = parseInt(hexColor.slice(1, 3), 16) || 2;
        const g = parseInt(hexColor.slice(3, 5), 16) || 136;
        const b = parseInt(hexColor.slice(5, 7), 16) || 209;

        doc.setFillColor(r, g, b);
        doc.setDrawColor(r, g, b);

        const steps = Math.ceil(pct * 120);
        for (let i = 0; i < steps; i++) {
          const alpha = currentAngle + (i / steps) * angleSweep;
          const nextAlpha = currentAngle + ((i + 1) / steps) * angleSweep;

          doc.triangle(
            cx,
            cy,
            cx + rOuter * Math.cos(alpha),
            cy + rOuter * Math.sin(alpha),
            cx + rOuter * Math.cos(nextAlpha),
            cy + rOuter * Math.sin(nextAlpha),
            "F",
          );
        }
        currentAngle += angleSweep;
      });

      // Hollow inner white circle
      doc.setFillColor(255, 255, 255);
      doc.circle(cx, cy, rInner, "F");

      // Thin inner outline
      doc.setDrawColor(240, 240, 240);
      doc.setLineWidth(0.5);
      doc.circle(cx, cy, rInner, "D");

      // Center title text
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(24, 24, 27);
      doc.text(centerTxt, cx, cy + 3.5, { align: "center" });
    };

    // --- TITLE HEADER ---
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(24, 24, 27); // Zinc-900
    doc.text("Summary report", margin, posY);

    // Tyme brand logo (Top-Right)
    const logoX = pageWidth - margin - 85;
    const logoY = posY - 7;

    // Draw outer dark cocoa rounded background
    doc.setFillColor(26, 15, 10); // #1A0F0A
    doc.roundedRect(logoX, logoY, 20, 20, 4, 4, "F");

    // Draw the 8 horizontal bars of the new hourglass logo
    doc.setFillColor(92, 61, 40); // Bar 1: #5C3D28
    doc.roundedRect(logoX + 3.4, logoY + 1.8, 13.2, 1.9, 0.9, 0.9, "F");

    doc.setFillColor(74, 44, 26); // Bar 2: #4A2C1A
    doc.roundedRect(logoX + 5.0, logoY + 4.3, 10.0, 1.7, 0.8, 0.8, "F");

    doc.setFillColor(61, 35, 20); // Bar 3: #3D2314
    doc.roundedRect(logoX + 6.6, logoY + 6.6, 6.8, 1.5, 0.7, 0.7, "F");

    doc.setFillColor(61, 35, 20); // Bar 4: #3D2314
    doc.roundedRect(logoX + 8.2, logoY + 8.7, 3.6, 1.3, 0.6, 0.6, "F");

    doc.setFillColor(129, 58, 18); // Bar 5: #E8651A (opacity 0.5 blended)
    doc.roundedRect(logoX + 8.2, logoY + 10.0, 3.6, 1.3, 0.6, 0.6, "F");

    doc.setFillColor(174, 77, 22); // Bar 6: #E8651A (opacity 0.72 blended)
    doc.roundedRect(logoX + 6.6, logoY + 11.9, 6.8, 1.5, 0.7, 0.7, "F");

    doc.setFillColor(203, 89, 24); // Bar 7: #E8651A (opacity 0.86 blended)
    doc.roundedRect(logoX + 5.0, logoY + 14.0, 10.0, 1.7, 0.8, 0.8, "F");

    doc.setFillColor(232, 101, 26); // Bar 8: #E8651A
    doc.roundedRect(logoX + 3.4, logoY + 16.3, 13.2, 1.9, 0.9, 0.9, "F");

    // Text label "Tyme" using beautiful deep chocolate shade
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16.5);
    doc.setTextColor(66, 49, 36);
    doc.text("Tyme", logoX + 25, logoY + 15);

    // Subtitle (Date range)
    posY += 18;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(110, 110, 110);
    doc.text(printDateRangeStr, margin, posY);

    // Metrics Row inline
    posY += 28;
    const amountVal = ((totalMinutes / 60) * hourlyRate).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(110, 110, 110);
    doc.text("Total: ", margin, posY);

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(24, 24, 27);
    let shiftX = margin + doc.getTextWidth("Total: ");
    doc.text(formatMinutesHHMM(totalMinutes), shiftX, posY);

    shiftX += doc.getTextWidth(formatMinutesHHMM(totalMinutes)) + 15;

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(110, 110, 110);
    doc.text("Billable: ", shiftX, posY);

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(24, 24, 27);
    shiftX += doc.getTextWidth("Billable: ");
    doc.text(formatMinutesHHMM(totalMinutes), shiftX, posY);

    shiftX += doc.getTextWidth(formatMinutesHHMM(totalMinutes)) + 15;

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(110, 110, 110);
    doc.text("Amount: ", shiftX, posY);

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(24, 24, 27);
    shiftX += doc.getTextWidth("Amount: ");
    const amountValStr = `${amountVal} USD`;
    doc.text(amountValStr, shiftX, posY);

    // -- CHART TIMELINE SECTION --
    posY += 30;

    const maxMinsValue = Math.max(...printChartData.map((d) => d.mins), 60);
    const maxHoursVal = maxMinsValue / 60;
    const chartMaxHours = Math.max(5.0, Math.ceil(maxHoursVal));

    const chartHeight = 120;
    const chartWidth = contentWidth - 40;
    const chartX = margin + 35;
    const chartY = posY;

    // Draw gridlines
    doc.setLineWidth(0.5);
    for (let i = 0; i <= 5; i++) {
      const ratio = i / 5;
      const lineY = chartY + chartHeight - ratio * chartHeight;

      // Grid line
      doc.setDrawColor(235, 235, 235);
      doc.line(chartX, lineY, chartX + chartWidth, lineY);

      // Y Label
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      const labelHours = ratio * chartMaxHours;
      doc.text(`${labelHours.toFixed(1)}h`, chartX - 6, lineY + 3, { align: "right" });
    }

    // Plots
    const barCount = printChartData.length;
    if (barCount > 0) {
      const slotWidth = chartWidth / barCount;
      const barWidth = Math.min(16, slotWidth * 0.55);

      printChartData.forEach((item, idx) => {
        const itemHours = item.mins / 60;
        const barHeight = (itemHours / chartMaxHours) * chartHeight;
        const bX = chartX + idx * slotWidth + (slotWidth - barWidth) / 2;
        const bY = chartY + chartHeight - barHeight;

        if (barHeight > 0) {
          doc.setFillColor(139, 195, 74); // Vibrant Clockify Green
          doc.rect(bX, bY, barWidth, barHeight, "F");
        }

        const showLabel = barCount <= 12 || idx % Math.ceil(barCount / 12) === 0;
        if (showLabel) {
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(120, 120, 120);
          doc.text(item.label, bX + barWidth / 2, chartY + chartHeight + 11, { angle: -35 });
        }
      });
    }

    posY += chartHeight + 45;

    // -- PROJECT ALLOCATIONS SECTION --
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(24, 24, 27);
    doc.text("Project", margin, posY);

    posY += 6;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(margin, posY, pageWidth - margin, posY);
    posY += 15;

    const projYStart = posY;
    let projY = posY;

    if (printProjectDonutSegments.length > 0) {
      printProjectDonutSegments.forEach((segment) => {
        const hexColor = segment.color || "#0288d1";
        const rVal = parseInt(hexColor.slice(1, 3), 16) || 2;
        const gVal = parseInt(hexColor.slice(3, 5), 16) || 136;
        const bVal = parseInt(hexColor.slice(5, 7), 16) || 209;

        // Color bullet
        doc.setFillColor(rVal, gVal, bVal);
        doc.circle(margin + 124, projY + 5.5, 3, "F");

        // Project Title
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 45);
        doc.text(segment.name, margin + 134, projY + 9);

        // Duration
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(24, 24, 27);
        doc.text(formatMinutesHHMM(segment.mins), pageWidth - margin - 50, projY + 9, {
          align: "right",
        });

        // Percent
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(110, 110, 110);
        doc.text(`${segment.percentage}%`, pageWidth - margin, projY + 9, { align: "right" });

        projY += 16;
      });

      // Draw donut chart on left
      drawDonut(
        margin + 45,
        projYStart + 35,
        32,
        18,
        printProjectDonutSegments,
        formatMinutesHHMM(totalMinutes),
      );
      posY = Math.max(projYStart + 75, projY) + 25;
    } else {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(140, 140, 140);
      doc.text("No active projects", margin, posY);
      posY += 20;
    }

    // -- DESCRIPTION ALLOCATIONS SECTION --
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(24, 24, 27);
    doc.text("Description", margin, posY);

    posY += 6;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(margin, posY, pageWidth - margin, posY);
    posY += 15;

    const descYStart = posY;
    let descY = posY;
    let drewDescDonut = false;
    let currentIsFirstPageOfDesc = true;

    if (printDescDonutSegments.length > 0) {
      printDescDonutSegments.forEach((segment) => {
        const textLimitWidth = currentIsFirstPageOfDesc ? 160 : contentWidth - 110;
        const wrappedDescLines = doc.splitTextToSize(segment.name, textLimitWidth) as string[];
        const rowHeight = Math.max(16, wrappedDescLines.length * 11) + 6;

        if (descY + rowHeight > pageHeight - 60) {
          if (currentIsFirstPageOfDesc && !drewDescDonut) {
            drawDonut(
              margin + 45,
              descYStart + 35,
              32,
              18,
              printDescDonutSegments,
              formatMinutesHHMM(totalMinutes),
            );
            drewDescDonut = true;
          }

          drawPageFooter(pageNum);
          doc.addPage();
          pageNum += 1;
          descY = 50;
          currentIsFirstPageOfDesc = false;
        }

        const hexColor = segment.color || "#dda67a";
        const rVal = parseInt(hexColor.slice(1, 3), 16) || 221;
        const gVal = parseInt(hexColor.slice(3, 5), 16) || 166;
        const bVal = parseInt(hexColor.slice(5, 7), 16) || 122;

        doc.setFillColor(rVal, gVal, bVal);
        doc.setDrawColor(rVal, gVal, bVal);

        const bulletX = currentIsFirstPageOfDesc ? margin + 124 : margin + 4;
        const textX = currentIsFirstPageOfDesc ? margin + 134 : margin + 16;
        const durX = pageWidth - margin - 50;
        const pctX = pageWidth - margin;

        // Bullet
        doc.circle(bulletX, descY + 5.5, 3, "F");

        // Text lines
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(24, 24, 27);
        wrappedDescLines.forEach((line, lIdx) => {
          doc.text(line, textX, descY + 9 + lIdx * 11);
        });

        // Values
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(24, 24, 27);
        doc.text(formatMinutesHHMM(segment.mins), durX, descY + 9, { align: "right" });

        doc.setFont("Helvetica", "normal");
        doc.setTextColor(110, 110, 110);
        doc.text(`${segment.percentage}%`, pctX, descY + 9, { align: "right" });

        descY += rowHeight;
      });

      if (currentIsFirstPageOfDesc && !drewDescDonut) {
        drawDonut(
          margin + 45,
          descYStart + 35,
          32,
          18,
          printDescDonutSegments,
          formatMinutesHHMM(totalMinutes),
        );
        drewDescDonut = true;
      }

      posY = descY + 20;
    } else {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(140, 140, 140);
      doc.text("No active descriptions", margin, posY);
      posY += 20;
    }

    // -- DETAILED SHEET LEDGER SECTION --
    posY += 15;

    if (posY + 40 > pageHeight - 60) {
      drawPageFooter(pageNum);
      doc.addPage();
      pageNum += 1;
      posY = 50;
    }

    // Ledger Header Row
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(110, 110, 110);
    doc.text("Project / Description", margin, posY);
    doc.text("Duration", pageWidth - margin - 100, posY, { align: "right" });
    doc.text("Amount", pageWidth - margin, posY, { align: "right" });

    posY += 5;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(1);
    doc.line(margin, posY, pageWidth - margin, posY);
    posY += 18;

    if (detailedLedgerGroups.length > 0) {
      detailedLedgerGroups.forEach((group) => {
        if (posY + 30 > pageHeight - 60) {
          drawPageFooter(pageNum);
          doc.addPage();
          pageNum += 1;
          posY = 50;
        }

        const projName = group.project?.name || "Unassigned Workspace tasks";
        const clientLabel = group.project?.client ? ` - ${group.project.client}` : "";
        const fullProjTitle = `${projName}${clientLabel}`;
        const groupMins = group.totalMins;
        const groupAmount = (groupMins / 60) * hourlyRate;

        // Write Project Group Header Row (Bold)
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(24, 24, 27);
        doc.text(fullProjTitle, margin, posY);

        doc.text(formatMinutesHHMM(groupMins), pageWidth - margin - 100, posY, { align: "right" });

        const formattedGrpAmt = `${groupAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
        doc.text(formattedGrpAmt, pageWidth - margin, posY, { align: "right" });

        posY += 6;
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.75);
        doc.line(margin, posY, pageWidth - margin, posY);
        posY += 15;

        // Write indented individual ledger tasks
        const tasks = Object.values(group.descriptions) as {
          mins: number;
          description: string;
          tags: string[];
        }[];
        tasks.forEach((task) => {
          const taskText = task.description || "No description";
          const wrappedLines = doc.splitTextToSize(taskText, contentWidth - 140) as string[];
          const blockHeight = Math.max(14, wrappedLines.length * 11) + 6;

          if (posY + blockHeight > pageHeight - 60) {
            drawPageFooter(pageNum);
            doc.addPage();
            pageNum += 1;
            posY = 50;

            doc.setFont("Helvetica", "normal");
            doc.setFontSize(8.5);
            doc.setTextColor(110, 110, 110);
            doc.text(`${fullProjTitle} (continued)`, margin, posY);
            posY += 15;
          }

          doc.setFont("Helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(60, 60, 60);
          wrappedLines.forEach((line, lIdx) => {
            doc.text(line, margin + 15, posY + 8 + lIdx * 11);
          });

          // Duration
          doc.text(formatMinutesHHMM(task.mins), pageWidth - margin - 100, posY + 8, {
            align: "right",
          });

          // Amount
          const taskAmount = (task.mins / 60) * hourlyRate;
          const formattedTaskAmt = `${taskAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
          doc.text(formattedTaskAmt, pageWidth - margin, posY + 8, { align: "right" });

          posY += blockHeight;

          // Tiny separator
          doc.setDrawColor(240, 240, 240);
          doc.setLineWidth(0.5);
          doc.line(margin + 15, posY, pageWidth - margin, posY);
          posY += 6;
        });

        posY += 8;
      });
    } else {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(150, 150, 150);
      doc.text("No workspace logs logged.", margin, posY);
      posY += 20;
    }

    // Draw final page footer
    drawPageFooter(pageNum);

    // Save
    const safeFilename = `Tyme_Report_${printDateRangeStr.replace(/\s+/g, "_").replace(/,/g, "")}.pdf`;
    doc.save(safeFilename);

    toast.success("Summary report exported successfully!", {
      description: `Saved as ${safeFilename}`,
      duration: 4000,
    });
  };

  // Quick reset helper
  const handleResetFilters = () => {
    setDatePreset("thisMonth");
    setSelectedProjId("");
    setSelectedTag("");
    setSearchQuery("");
  };

  // SVGs pie parameters
  const donutChartSegments = useMemo(() => {
    let total = projectAggregates.reduce((acc, p) => acc + p.mins, 0);
    if (total === 0) return [];

    let cumAngle = -90; // start top position (clock direction)
    return projectAggregates.map((p) => {
      const pct = p.mins / total;
      const angle = pct * 360;
      const startAngle = cumAngle;
      const endAngle = cumAngle + angle;
      cumAngle += angle;

      // Coordinate converter helper
      const polarToCartesian = (
        centerX: number,
        centerY: number,
        radius: number,
        angleInDegrees: number,
      ) => {
        const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
        return {
          x: centerX + radius * Math.cos(angleInRadians),
          y: centerY + radius * Math.sin(angleInRadians),
        };
      };

      const describeArc = (
        x: number,
        y: number,
        radius: number,
        startAngle: number,
        endAngle: number,
      ) => {
        const start = polarToCartesian(x, y, radius, endAngle);
        const end = polarToCartesian(x, y, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(
          " ",
        );
      };

      const pathData = describeArc(100, 100, 70, startAngle, endAngle);

      return {
        ...p,
        pathData,
        percentage: (pct * 100).toFixed(1),
      };
    });
  }, [projectAggregates]);

  // 1. Generate full scale continuous range of dates for printing X Axis
  const datesInRange = useMemo(() => {
    let minDateStr = "";
    let maxDateStr = "";

    if (datePreset === "allTime") {
      if (filteredEntries.length === 0) return [];
      const dateSorted = [...filteredEntries].sort((a, b) => a.date.localeCompare(b.date));
      minDateStr = dateSorted[0].date;
      maxDateStr = dateSorted[dateSorted.length - 1].date;
    } else {
      ({ minDateStr, maxDateStr } = getPresetDateRange(datePreset));
    }

    const start = new Date(minDateStr + "T00:00:00");
    const end = new Date(maxDateStr + "T00:00:00");
    const arr: Date[] = [];
    const current = new Date(start);

    let maxLimit = 100; // safety
    while (current <= end && maxLimit > 0) {
      arr.push(new Date(current));
      current.setDate(current.getDate() + 1);
      maxLimit--;
    }
    return arr;
  }, [datePreset, filteredEntries]);

  // 2. Fetch specific duration mapped to indices list for high-precision SVG drawing on print
  const printChartData = useMemo(() => {
    return datesInRange.map((dateObj) => {
      const yStr = dateObj.getFullYear();
      const mStr = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dStr = String(dateObj.getDate()).padStart(2, "0");
      const dateKey = `${yStr}-${mStr}-${dStr}`;

      const dayMins = filteredEntries
        .filter((e) => e.date === dateKey)
        .reduce((sum, e) => sum + getDisplayMinutes(e.durationMinutes), 0);

      const friendlyLabel = dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      return {
        dateStr: dateKey,
        label: friendlyLabel,
        mins: dayMins,
      };
    });
  }, [datesInRange, filteredEntries, roundingActive]);

  // 3. Formatted Printable Date Range string
  const printDateRangeStr = useMemo(() => {
    // Convert a "YYYY-MM-DD" string to "MM/DD/YYYY"
    const toMMDDYYYY = (d: Date) => {
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${m}/${day}/${d.getFullYear()}`;
    };

    if (datePreset === "allTime") {
      if (filteredEntries.length === 0) return "All Records";
      const sorted = [...filteredEntries].sort((a, b) => a.date.localeCompare(b.date));
      const minD = new Date(sorted[0].date + "T00:00:00");
      const maxD = new Date(sorted[sorted.length - 1].date + "T00:00:00");
      return `${toMMDDYYYY(minD)} - ${toMMDDYYYY(maxD)}`;
    }

    const { minDateStr, maxDateStr } = getPresetDateRange(datePreset);
    const minD = new Date(minDateStr + "T00:00:00");
    const maxD = new Date(maxDateStr + "T00:00:00");
    return `${toMMDDYYYY(minD)} - ${toMMDDYYYY(maxD)}`;
  }, [datePreset, filteredEntries]);

  // 4. Description groupings for donut charts and summary listing
  const descriptionAggregates = useMemo(() => {
    const map: Record<string, { mins: number; name: string; color: string }> = {};
    const palette = [
      "#a66e46",
      "#dda67a",
      "#c5b3a6",
      "#5c4033",
      "#10b981",
      "#3b82f6",
      "#f59e0b",
      "#ec4899",
      "#8b5cf6",
      "#06b6d4",
    ];

    filteredEntries.forEach((entry) => {
      const desc = entry.description.trim() || "No Description";
      if (!map[desc]) {
        const color = palette[Object.keys(map).length % palette.length];
        map[desc] = { mins: 0, name: desc, color };
      }
      map[desc].mins += entry.durationMinutes;
    });

    return Object.values(map).sort((a, b) => b.mins - a.mins);
  }, [filteredEntries]);

  // 5. Compute print specific segments safely
  const printProjectDonutSegments = useMemo(() => {
    let total = projectAggregates.reduce((acc, p) => acc + p.mins, 0);
    if (total === 0) return [];

    let cumAngle = -90;
    return projectAggregates.map((p) => {
      const pct = p.mins / total;
      const angle = pct * 360;
      const startAngle = cumAngle;
      const endAngle = cumAngle + angle;
      cumAngle += angle;

      const polarToCartesian = (
        centerX: number,
        centerY: number,
        radius: number,
        angleInDegrees: number,
      ) => {
        const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
        return {
          x: centerX + radius * Math.cos(angleInRadians),
          y: centerY + radius * Math.sin(angleInRadians),
        };
      };

      const describeArc = (
        x: number,
        y: number,
        radius: number,
        startAngle: number,
        endAngle: number,
      ) => {
        const isFullCircle = endAngle - startAngle >= 359.9;
        const actualEnd = isFullCircle ? startAngle + 359.99 : endAngle;
        const start = polarToCartesian(x, y, radius, actualEnd);
        const end = polarToCartesian(x, y, radius, startAngle);
        const largeArcFlag = actualEnd - startAngle <= 180 ? "0" : "1";
        return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(
          " ",
        );
      };

      return {
        ...p,
        pathData: describeArc(100, 100, 70, startAngle, endAngle),
        percentage: (pct * 100).toFixed(1),
      };
    });
  }, [projectAggregates]);

  const printDescDonutSegments = useMemo(() => {
    let total = descriptionAggregates.reduce((acc, p) => acc + p.mins, 0);
    if (total === 0) return [];

    let cumAngle = -90;
    return descriptionAggregates.map((p) => {
      const pct = p.mins / total;
      const angle = pct * 360;
      const startAngle = cumAngle;
      const endAngle = cumAngle + angle;
      cumAngle += angle;

      const polarToCartesian = (
        centerX: number,
        centerY: number,
        radius: number,
        angleInDegrees: number,
      ) => {
        const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
        return {
          x: centerX + radius * Math.cos(angleInRadians),
          y: centerY + radius * Math.sin(angleInRadians),
        };
      };

      const describeArc = (
        x: number,
        y: number,
        radius: number,
        startAngle: number,
        endAngle: number,
      ) => {
        const isFullCircle = endAngle - startAngle >= 359.9;
        const actualEnd = isFullCircle ? startAngle + 359.99 : endAngle;
        const start = polarToCartesian(x, y, radius, actualEnd);
        const end = polarToCartesian(x, y, radius, startAngle);
        const largeArcFlag = actualEnd - startAngle <= 180 ? "0" : "1";
        return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(
          " ",
        );
      };

      return {
        ...p,
        pathData: describeArc(100, 100, 70, startAngle, endAngle),
        percentage: (pct * 100).toFixed(1),
      };
    });
  }, [descriptionAggregates]);

  // 6. Group all time entries specifically for detailed PDF style table
  const detailedLedgerGroups = useMemo(() => {
    const projectGroups: Record<
      string,
      {
        project: Project | null;
        totalMins: number;
        descriptions: Record<string, { mins: number; description: string; tags: string[] }>;
      }
    > = {};

    filteredEntries.forEach((entry) => {
      const projId = entry.projectId || "unassigned";
      const proj = projects.find((p) => p.id === projId) || null;

      if (!projectGroups[projId]) {
        projectGroups[projId] = {
          project: proj,
          totalMins: 0,
          descriptions: {},
        };
      }

      const group = projectGroups[projId];
      group.totalMins += entry.durationMinutes;

      const descKey = entry.description.trim() || "No Description";
      if (!group.descriptions[descKey]) {
        group.descriptions[descKey] = {
          mins: 0,
          description: descKey,
          tags: [],
        };
      }

      group.descriptions[descKey].mins += entry.durationMinutes;
      entry.tags.forEach((t) => {
        if (!group.descriptions[descKey].tags.includes(t)) {
          group.descriptions[descKey].tags.push(t);
        }
      });
    });

    return Object.values(projectGroups).sort((a, b) => b.totalMins - a.totalMins);
  }, [filteredEntries, projects]);

  return (
    <div className='flex-1 flex flex-col min-w-0 z-10 overflow-y-auto'>
      {/* 1. Page Header with Print & Export actions */}
      <header className='p-4 border-b shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#120805]/40 backdrop-blur-md border-[#321c11]/45 print:hidden'>
        <div>
          <h2 className='text-xl font-display font-semibold text-white'>Time Analysis & Reports</h2>
          <p className='text-xs text-[#ecd0b9]/65 mt-1'>
            Displaying{" "}
            <span className='font-semibold text-[#dda67a]'>{filteredEntries.length} entries</span>{" "}
            based on current selected criteria
          </p>
        </div>

        <div className='flex items-center gap-1.5 sm:gap-2 overflow-x-auto'>
          {/* Reset Filters */}
          <button
            onClick={handleResetFilters}
            className='p-2 text-[#ecd0b9]/50 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer'
            title='Reset Filters'
          >
            <RotateCcw className='h-4.5 w-4.5' />
          </button>

          {/* Hourly Billing Rate (View Only) */}
          <div 
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#3d2416]/55 bg-[#24150d]/40 text-xs font-semibold text-[#ecd0b9]"
            title="Hourly billing rate (Configure in Settings)"
          >
            <DollarSign className="h-3.5 w-3.5 text-[#dda67a]" />
            <span className="font-mono font-bold text-white">${Number(hourlyRate).toFixed(2).replace(/\.00$/, "")}</span>
            <span className="text-[10px] text-[#ecd0b9]/60">/hr</span>
          </div>

          {/* Export CSV button */}
          <button
            onClick={() => exportToCSV(filteredEntries, projects)}
            disabled={filteredEntries.length === 0}
            className='px-3.5 py-2 whitespace-nowrap text-xs font-semibold rounded-xl border border-[#3d2416]/55 bg-[#24150d]/40 cursor-pointer text-[#ecd0b9] hover:bg-[#3d2416]/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition'
          >
            <Download className='h-4 w-4 text-emerald-400' />
            <span className='hidden sm:inline'>Export CSV</span>
          </button>

          {/* Create custom print button (works as export PDF!) */}
          <button
            onClick={handlePrintPDF}
            disabled={filteredEntries.length === 0}
            className='px-3.5 py-2 whitespace-nowrap text-xs font-semibold rounded-xl bg-[#a66e46] cursor-pointer text-white hover:bg-[#8e5a34] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-[#4a2b16]/30 transition'
          >
            <Printer className='h-4 w-4' />
            <span className='hidden sm:inline'>Print Report (PDF)</span>
          </button>
        </div>
      </header>

      {/* 3. Metrics Summary widgets section */}
      <section className='p-4 md:p-6 space-y-6 print:hidden'>
        {/* KPI Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {/* Card 1: Total logged hours */}
          <div className='bg-[#130d0a]/35 backdrop-blur-xl border border-[#3e271a]/55 p-5 rounded-2xl shadow-xl shadow-black/5 flex items-center justify-between'>
            <div>
              <p className='text-[11px] font-mono text-[#ecd0b9]/70 uppercase tracking-wider font-semibold'>
                Total Hours Tracked
              </p>
              <h4 className='text-xl md:text-2xl font-display font-bold text-white mt-2 font-mono'>
                {formatMinutesHHMM(totalMinutes)}
              </h4>
              <p className='text-[10px] text-[#ecd0b9]/45 mt-1'>
                Equivalent to {formatMinutesDecimal(totalMinutes)} decimal hours
              </p>
            </div>
            <div className='h-10 w-10 md:h-12 md:w-12 rounded-xl bg-[#dda67a]/20 flex items-center justify-center text-[#dda67a]'>
              <BarChart2 className='h-6 w-6 stroke-[2px]' />
            </div>
          </div>

          {/* Card 2: Total Amount */}
          <div className='bg-[#130d0a]/35 backdrop-blur-xl border border-[#3e271a]/55 p-5 rounded-2xl shadow-xl shadow-black/5 flex items-center justify-between'>
            <div>
              <p className='text-[11px] font-mono text-[#ecd0b9]/70 uppercase tracking-wider font-semibold'>
                Total Amount
              </p>
              <h4 className='text-xl md:text-2xl font-display font-bold text-white mt-2 font-mono'>
                $
                {((totalMinutes / 60) * hourlyRate).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                <span className='text-xs font-sans font-normal text-[#ecd0b9]/50'>USD</span>
              </h4>
              <p className='text-[10px] text-[#ecd0b9]/45 mt-1'>
                Based on flat billable rate of {hourlyRate.toLocaleString("en-US", { style: "currency", currency: "USD" })}/hr
              </p>
            </div>
            <div className='h-10 w-10 md:h-12 md:w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400'>
              <DollarSign className='h-6 w-6' />
            </div>
          </div>

          {/* Card 3: Total Logs Count */}
          <div className='bg-[#130d0a]/35 backdrop-blur-xl border border-[#3e271a]/55 p-5 rounded-2xl shadow-xl shadow-black/5 flex items-center justify-between'>
            <div>
              <p className='text-[11px] font-mono text-[#ecd0b9]/70 uppercase tracking-wider font-semibold'>
                Entries Logged
              </p>
              <h4 className='text-xl md:text-2xl font-display font-bold text-white mt-2 font-mono'>
                {filteredEntries.length}
              </h4>
              <p className='text-[10px] text-[#ecd0b9]/45 mt-1'>
                Total standalone logged task intervals matching criteria
              </p>
            </div>
            <div className='h-10 w-10 md:h-12 md:w-12 rounded-xl bg-[#a66e46]/20 flex items-center justify-center text-white'>
              <Sparkles className='h-6 w-6' />
            </div>
          </div>
        </div>

        {/* 4. Visual Analytics Section */}
        <div className='space-y-6'>
          {/* Replicated Full-Width Timeline Hours Chart (styled to match screenshot) */}
          <div className='bg-[#11171d] border border-[#232f3b]/70 rounded-2xl shadow-2xl overflow-hidden'>
            {/* Screenshot top-bar replicate flow */}
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#17212a] px-5 py-3.5 border-b border-[#232f3b]/60 gap-4'>
              <div className='flex items-center gap-1.5'>
                <span className='text-xs font-mono text-[#ecd0b9]/55 font-bold uppercase tracking-wider'>
                  Total:
                </span>
                <span className='text-lg font-bold font-mono text-white'>
                  {formatMinutesHHMM(totalMinutes)}
                </span>
              </div>

              <div className='flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end'>
                <div className='flex items-center gap-2'>
                  <span className='text-[10px] uppercase font-mono text-[#ecd0b9]/50 font-bold tracking-wider'>
                    Date Range:
                  </span>
                  <div className='relative'>
                    <select
                      value={datePreset}
                      onChange={(e) => setDatePreset(e.target.value as PresetFilterType)}
                      className='text-xs font-sans font-bold bg-[#11171d] hover:bg-[#1a2530] text-white border border-[#2d3a46] rounded-xl pl-3 pr-8 py-1.5 outline-none cursor-pointer transition appearance-none min-w-[120px] md:min-w-[140px]'
                    >
                      <option value='thisWeek'>This Week</option>
                      <option value='lastWeek'>Last Week</option>
                      <option value='thisMonth'>Current Month</option>
                      <option value='lastMonth'>Previous Month</option>
                      <option value='allTime'>All Records</option>
                    </select>
                    <div className='absolute inset-y-0 right-2 flex items-center pr-1 pointer-events-none text-[#ecd0b9]/50'>
                      <svg className='h-3 w-3 fill-current' viewBox='0 0 20 20'>
                        <path d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart canvas area precisely replicating the screenshot */}
            <div className='p-3 md:p-6 bg-[#11171d]'>
              <div className='w-full overflow-x-auto'>
                <div className='min-w-[500px] md:min-w-[800px] select-none'>
                  <svg viewBox='0 0 1000 240' className='w-full h-auto font-sans'>
                    {/* Grid Ticks on the Left & horizontal guidance lines */}
                    {Array.from({ length: 11 }).map((_, idx) => {
                      const maxMinsValue =
                        printChartData.length > 0
                          ? Math.max(...printChartData.map((d) => d.mins))
                          : 0;
                      const maxHoursVal = maxMinsValue / 60;
                      const chartMaxHours = Math.max(5.0, Math.ceil(maxHoursVal * 2) / 2);
                      const tickValue = (chartMaxHours / 10) * (10 - idx);
                      const y = 25 + idx * 17.5; // range from 25 to 200 (175px space)
                      return (
                        <g key={idx}>
                          <line
                            x1='70'
                            y1={y}
                            x2='970'
                            y2={y}
                            stroke='#1e2933'
                            strokeDasharray='2 3'
                            strokeWidth='0.8'
                          />
                          <text
                            x='58'
                            y={y + 3}
                            fontSize='8.5'
                            fontFamily='monospace'
                            fill='#6b7c8c'
                            textAnchor='end'
                            fontWeight='600'
                          >
                            {tickValue === 0.5 ? "0.50h" : `${tickValue.toFixed(1)}h`}
                          </text>
                        </g>
                      );
                    })}

                    {/* Empty Chart Message overlay */}
                    {printChartData.length === 0 && (
                      <text
                        x='520'
                        y='120'
                        fill='#6b7c8c'
                        fontSize='13'
                        fontFamily='sans-serif'
                        textAnchor='middle'
                        fontWeight='500'
                        opacity='0.8'
                      >
                        No active tracker records in this range
                      </text>
                    )}

                    {/* Bar columns plotting each selected range day */}
                    {printChartData.map((item, idx) => {
                      const maxMinsValue =
                        printChartData.length > 0
                          ? Math.max(...printChartData.map((d) => d.mins))
                          : 0;
                      const maxHoursVal = maxMinsValue / 60;
                      const chartMaxHours = Math.max(5.0, Math.ceil(maxHoursVal * 2) / 2);
                      const barHeight = (item.mins / 60 / chartMaxHours) * 175;
                      const slotWidth = printChartData.length > 0 ? 900 / printChartData.length : 1; // prevent division by zero / Infinity
                      const barWidth = Math.min(24, Math.max(3, slotWidth * 0.55));
                      const x = 70 + idx * slotWidth + (slotWidth - barWidth) / 2;
                      const y = 200 - barHeight;

                      // Calculate label step intervals so angled labels do not overlap
                      const labelStepInterval =
                        printChartData.length <= 7
                          ? 1
                          : printChartData.length <= 15
                            ? 2
                            : printChartData.length <= 22
                              ? 3
                              : 4;
                      const shouldShowLabel =
                        idx % labelStepInterval === 0 || idx === printChartData.length - 1;

                      return (
                        <g key={idx} className='group'>
                          {/* Bar rect */}
                          {barHeight > 0 && (
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={barHeight}
                              fill='#dda67a' // Warm gold brand accent
                              rx='1.5'
                              className='hover:fill-[#ffdda6] transition-all duration-150 cursor-pointer'
                            >
                              <title>{`${item.label}: ${formatMinutesHHMM(item.mins)}`}</title>
                            </rect>
                          )}

                          {/* X-axis tick label text angled */}
                          {shouldShowLabel && (
                            <g transform={`translate(${x + barWidth / 2}, 215)`}>
                              <text
                                textAnchor='end'
                                fontSize='8.5'
                                fontWeight='600'
                                fill='#6b7c8c'
                                transform='rotate(-25)'
                              >
                                {item.label}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Printable Detailed Log Entries List */}
        <div className='bg-[#130d0a]/35 backdrop-blur-xl border border-[#3e271a]/55 rounded-2xl overflow-hidden shadow-xl shadow-black/5'>
          <div className='p-4 md:p-5 border-b border-[#3e271a]/55 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3'>
            <h3 className='text-base font-display font-bold text-white'>Detailed Sheet Ledger</h3>
            <span className='text-xs font-mono bg-[#1d1410] border border-[#3e271a] px-3 py-1 rounded-full text-[#ecd0b9]/70 font-bold'>
              Showing {filteredEntries.length} Records
            </span>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full text-left border-collapse text-xs'>
              <thead>
                <tr className='border-b border-[#3e271a]/55 bg-[#1a100c]/75 font-semibold text-[#ecd0b9]/75'>
                  <th className='p-2.5 md:p-4'>Date</th>
                  <th className='p-2.5 md:p-4'>Description</th>
                  <th className='p-2.5 md:p-4 hidden md:table-cell'>Project / client</th>
                  <th className='p-2.5 md:p-4 hidden md:table-cell'>Timeline</th>
                  <th className='p-2.5 md:p-4 text-right'>Duration</th>
                  <th className='p-2.5 md:p-4 text-center print:hidden hidden lg:table-cell'>
                    Tags
                  </th>
                  <th className='p-2.5 md:p-4 text-right print:hidden'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-[#3e271a]/35 text-[#ecd0b9]/85'>
                {filteredEntries.map((row) => {
                  const proj = row.projectId ? projects.find((p) => p.id === row.projectId) : null;
                  return (
                    <tr key={row.id} className='hover:bg-[#342118]/20 transition-all duration-75'>
                      <td className='p-2.5 md:p-4 whitespace-nowrap font-mono font-medium text-[#ecd0b9]/75 text-[10px] md:text-xs'>
                        {formatDateFriendly(new Date(row.date + "T00:00:00"))}
                      </td>
                      <td className='p-2.5 md:p-4 font-semibold text-white max-w-[120px] md:max-w-xs break-words truncate md:whitespace-normal'>
                        {row.description || "No Description"}
                      </td>
                      <td className='p-2.5 md:p-4 whitespace-nowrap hidden md:table-cell'>
                        {proj ? (
                          <div className='flex flex-col'>
                            <span
                              className='flex items-center gap-1.5 font-bold'
                              style={{ color: proj.color }}
                            >
                              <span
                                className='h-2 w-2 rounded-full'
                                style={{ backgroundColor: proj.color }}
                              ></span>
                              {proj.name}
                            </span>
                            {proj.client && (
                              <span className='text-[10px] text-[#ecd0b9]/45 font-medium pl-3.5'>
                                Client: {proj.client}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className='text-[#ecd0b9]/30'>None</span>
                        )}
                      </td>
                      <td className='p-2.5 md:p-4 whitespace-nowrap font-mono text-[#ecd0b9]/65 hidden md:table-cell'>
                        {row.startTime} - {row.endTime}
                      </td>
                      <td className='p-2.5 md:p-4 whitespace-nowrap text-right font-mono font-bold text-[#dda67a]'>
                        {formatMinutesHHMM(row.durationMinutes)}
                      </td>
                      <td className='p-2.5 md:p-4 print:hidden text-center hidden lg:table-cell'>
                        <div className='flex flex-wrap justify-center gap-1 max-w-[120px]'>
                          {row.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className='px-2 py-0.5 rounded text-[10px] font-medium bg-[#1d1410] border border-[#3e271a]/65 text-[#ecd0b9]/75'
                            >
                              {tag}
                            </span>
                          ))}
                          {row.tags.length === 0 && (
                            <span className='text-[#ecd0b9]/30 text-[10px]'>-</span>
                          )}
                        </div>
                      </td>
                      <td className='p-2.5 md:p-4 text-right whitespace-nowrap print:hidden'>
                        <div className='flex justify-end gap-1'>
                          <button
                            onClick={() => onDuplicateEntry(row)}
                            className='p-1.5 rounded-lg hover:bg-[#3e271a]/30 text-[#ecd0b9]/60 hover:text-[#dda67a] cursor-pointer transition'
                            title='Duplicate record'
                          >
                            <Copy className='h-4 w-4' />
                          </button>
                          <button
                            onClick={() => onDeleteEntry(row.id)}
                            className='p-1.5 rounded-lg hover:bg-[#3e271a]/30 text-[#ecd0b9]/60 hover:text-red-400 cursor-pointer transition'
                            title='Delete record'
                          >
                            <Trash2 className='h-4 w-4' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan={7} className='p-8 text-center text-[#ecd0b9]/45 font-mono'>
                      No records match active criteria. Set date parameters or track inside the
                      Calendar dashboard.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ==================== PRINT REPORT TEMPLATE (PDF ONLY) ==================== */}
      <div
        id='print-pdf-report'
        className='hidden print:block bg-white text-stone-900 font-sans p-6 min-h-screen text-xs'
      >
        {/* PDF Header Section */}
        <header className='flex justify-between items-start border-b border-stone-200 pb-5'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight text-stone-950 font-display'>
              Summary report
            </h1>
            <p className='text-xs text-stone-500 font-medium font-mono mt-1'>
              Ref range: {printDateRangeStr}
            </p>
          </div>

          <div className='flex items-center gap-2 border border-stone-200 bg-stone-50 p-2.5 rounded-xl'>
            <BrandLogo size={24} showBackground={false} className='brightness-90 select-none pointer-events-none' />
            <div className='text-right'>
              <span className='text-[10px] uppercase font-mono tracking-wider font-extrabold text-stone-700 leading-none block'>
                Tyme
              </span>
              <span className='text-[8px] font-mono text-stone-400 block mt-0.5'>
                dczabala2@gmail.com
              </span>
            </div>
          </div>
        </header>

        {/* Global Summary Metrics Cards */}
        <section className='grid grid-cols-3 gap-4 py-4 my-2'>
          <div className='bg-stone-50 border border-stone-200 p-4 rounded-xl flex flex-col justify-center'>
            <span className='text-[9px] uppercase font-mono text-stone-400 font-bold tracking-wider'>
              Total Duration
            </span>
            <div className='text-lg font-bold font-mono text-stone-900 mt-1'>
              {formatMinutesHHMM(totalMinutes)}
            </div>
          </div>

          <div className='bg-stone-50 border border-stone-200 p-4 rounded-xl flex flex-col justify-center'>
            <span className='text-[9px] uppercase font-mono text-stone-400 font-bold tracking-wider'>
              Billable Duration
            </span>
            <div className='text-lg font-bold font-mono text-[#a66e46] mt-1'>
              {formatMinutesHHMM(totalMinutes)}
            </div>
          </div>

          <div className='bg-stone-50 border border-stone-200 p-4 rounded-xl flex flex-col justify-center'>
            <span className='text-[9px] uppercase font-mono text-stone-400 font-bold tracking-wider'>
              Total Amount billed
            </span>
            <div className='text-lg font-bold font-mono text-stone-900 mt-1'>
              $
              {((totalMinutes / 60) * hourlyRate).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              <span className='text-[10px] text-stone-500 font-sans font-normal'>USD</span>
            </div>
          </div>
        </section>

        {/* Vertical SVG Active Hours Bar Chart (Perfect Vector scaling) */}
        <section className='border border-stone-200 rounded-2xl p-5 bg-stone-50/30 my-4'>
          <h2 className='text-[10px] font-bold font-mono uppercase tracking-wider text-stone-500 mb-4'>
            Logged Hours Timeline
          </h2>

          {printChartData.length > 0 ? (
            <div className='w-full'>
              <svg viewBox='0 0 800 240' className='w-full h-auto'>
                {/* Horizontal Guide Lines */}
                {Array.from({ length: 6 }).map((_, idx) => {
                  const maxMinsValue = Math.max(...printChartData.map((d) => d.mins), 60);
                  const maxHoursVal = Math.max(1, Math.ceil(maxMinsValue / 60));
                  const tickVal = (maxHoursVal / 5) * (5 - idx);
                  const y = 20 + idx * 36; // 20 to 200 space (height 180)
                  return (
                    <g key={idx}>
                      <line
                        x1='54'
                        y1={y}
                        x2='780'
                        y2={y}
                        stroke='#e5e5e4'
                        strokeDasharray='3 3'
                        strokeWidth='0.8'
                      />
                      <text
                        x='12'
                        y={y + 3}
                        fontSize='9'
                        fontFamily='monospace'
                        fill='#6b6a69'
                        textAnchor='start'
                      >
                        {tickVal.toFixed(1)}h
                      </text>
                    </g>
                  );
                })}

                {/* Vertical column bars represent log dates */}
                {printChartData.map((item, idx) => {
                  const maxMinsValue = Math.max(...printChartData.map((d) => d.mins), 60);
                  const maxHoursVal = Math.max(1, Math.ceil(maxMinsValue / 60));
                  const barH = (item.mins / 60 / maxHoursVal) * 180;

                  const count = printChartData.length;
                  const availableW = 726; // X bounds 54 to 780
                  const slotW = availableW / count;
                  const gapRatio = 0.65;
                  const barW = Math.max(3, slotW * gapRatio);
                  const x = 54 + idx * slotW + (slotW - barW) / 2;
                  const y = 200 - barH;

                  return (
                    <g key={idx} className='group'>
                      {/* Render bar shape */}
                      {barH > 0 && (
                        <rect x={x} y={y} width={barW} height={barH} fill='#a66e46' rx='1.5' />
                      )}

                      {/* Tick or Label beneath column */}
                      {(count <= 15 || idx % Math.ceil(count / 15) === 0) && (
                        <text
                          x={x + barW / 2}
                          y='215'
                          textAnchor='end'
                          fontSize='7.5'
                          fontFamily='sans-serif'
                          fontWeight='bold'
                          fill='#44403c'
                          transform={`rotate(-40, ${x + barW / 2}, 215)`}
                        >
                          {item.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className='p-8 text-center text-stone-400 italic'>
              No timeline entries generated.
            </div>
          )}
        </section>

        {/* Ring Donut Allocations side-by-side splits */}
        <section className='grid grid-cols-2 gap-6 my-4'>
          {/* Project Ring Breakdowns */}
          <div className='border border-stone-200 rounded-2xl p-4 bg-stone-50/10 flex flex-col justify-between'>
            <h3 className='text-[10px] font-bold font-mono tracking-wider uppercase text-stone-500 mb-3 pb-1 border-b border-stone-100'>
              Project Allocations
            </h3>
            <div className='flex items-center gap-4'>
              <div className='relative shrink-0 w-28 h-28 flex items-center justify-center'>
                {printProjectDonutSegments.length > 0 ? (
                  <>
                    <svg className='w-full h-full transform -rotate-90' viewBox='0 0 200 200'>
                      {printProjectDonutSegments.map((seg, sIdx) => (
                        <path
                          key={sIdx}
                          d={seg.pathData}
                          fill='none'
                          stroke={seg.color}
                          strokeWidth='22'
                        />
                      ))}
                    </svg>
                    <div className='absolute inset-0 flex flex-col items-center justify-center'>
                      <span className='text-[8px] font-mono leading-none text-stone-400 font-bold uppercase tracking-widest'>
                        Total
                      </span>
                      <span className='text-xs font-bold font-mono text-stone-800 mt-0.5'>
                        {formatMinutesHHMM(totalMinutes)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className='text-[8px] font-mono uppercase text-stone-400'>Empty</div>
                )}
              </div>

              {/* Project Legend list right side */}
              <div className='flex-1 space-y-1.5 text-[10px] max-h-28 overflow-hidden pr-0.5'>
                {printProjectDonutSegments.slice(0, 5).map((item, idx) => (
                  <div key={idx} className='flex items-center justify-between text-stone-700'>
                    <span className='flex items-center gap-1.5 truncate font-medium'>
                      <span
                        className='h-1.5 w-1.5 rounded-full shrink-0'
                        style={{ backgroundColor: item.color }}
                      />
                      <span className='truncate max-w-[100px]'>{item.name}</span>
                    </span>
                    <span className='font-mono text-stone-900 font-bold pl-2 whitespace-nowrap'>
                      {formatMinutesHHMM(item.mins)} ({item.percentage}%)
                    </span>
                  </div>
                ))}
                {printProjectDonutSegments.length === 0 && (
                  <span className='text-stone-400 italic font-mono text-[9px]'>No items</span>
                )}
              </div>
            </div>
          </div>

          {/* Description Ring Breakdowns */}
          <div className='border border-stone-200 rounded-2xl p-4 bg-stone-50/10 flex flex-col justify-between'>
            <h3 className='text-[10px] font-bold font-mono tracking-wider uppercase text-stone-500 mb-3 pb-1 border-b border-stone-100'>
              Description Allocations
            </h3>
            <div className='flex items-center gap-4'>
              <div className='relative shrink-0 w-28 h-28 flex items-center justify-center'>
                {printDescDonutSegments.length > 0 ? (
                  <>
                    <svg className='w-full h-full transform -rotate-90' viewBox='0 0 200 200'>
                      {printDescDonutSegments.map((seg, sIdx) => (
                        <path
                          key={sIdx}
                          d={seg.pathData}
                          fill='none'
                          stroke={seg.color}
                          strokeWidth='22'
                        />
                      ))}
                    </svg>
                    <div className='absolute inset-0 flex flex-col items-center justify-center'>
                      <span className='text-[8px] font-mono leading-none text-stone-400 font-bold uppercase tracking-widest'>
                        Total
                      </span>
                      <span className='text-xs font-bold font-mono text-stone-800 mt-0.5'>
                        {formatMinutesHHMM(totalMinutes)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className='text-[8px] font-mono uppercase text-stone-400'>Empty</div>
                )}
              </div>

              {/* Description Legend list right side */}
              <div className='flex-1 space-y-1.5 text-[10px] max-h-28 overflow-hidden pr-0.5'>
                {printDescDonutSegments.slice(0, 5).map((item, idx) => (
                  <div key={idx} className='flex items-center justify-between text-stone-700'>
                    <span className='flex items-center gap-1.5 truncate font-medium'>
                      <span
                        className='h-1.5 w-1.5 rounded-full shrink-0'
                        style={{ backgroundColor: item.color }}
                      />
                      <span className='truncate max-w-[100px]'>{item.name}</span>
                    </span>
                    <span className='font-mono text-stone-900 font-bold pl-2 whitespace-nowrap'>
                      {formatMinutesHHMM(item.mins)} ({item.percentage}%)
                    </span>
                  </div>
                ))}
                {printDescDonutSegments.length === 0 && (
                  <span className='text-stone-400 italic font-mono text-[9px]'>No items</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Sheet Ledger layout */}
        <section className='mt-6 border-t border-stone-200 pt-5'>
          <h3 className='text-xs font-bold uppercase font-mono tracking-wider text-stone-600 mb-4 pb-1.5 border-b border-stone-100'>
            Detailed Sheet Ledger
          </h3>

          <div className='space-y-4'>
            {detailedLedgerGroups.map((group, gIdx) => {
              const projAmount = (group.totalMins / 60) * hourlyRate;
              return (
                <div
                  key={gIdx}
                  className='border border-stone-200 rounded-xl overflow-hidden shadow-sm page-break-inside-avoid bg-white'
                >
                  {/* Project Headline band */}
                  <div className='bg-stone-100/90 px-4 py-2.5 flex justify-between items-center border-b border-stone-200'>
                    <div>
                      <span className='text-xs font-bold text-stone-900 flex items-center gap-2'>
                        <span
                          className='h-2 w-2 rounded-full shrink-0'
                          style={{ backgroundColor: group.project?.color || "#a66e46" }}
                        />
                        {group.project?.name || "Unassigned Workspace tasks"}
                        {group.project?.client && (
                          <span className='text-stone-500 font-normal ml-1'>
                            ({group.project.client})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className='flex items-center gap-4 text-xs font-bold font-mono'>
                      <span className='text-stone-600'>{formatMinutesHHMM(group.totalMins)}</span>
                      <span className='text-[#a66e46]'>
                        $
                        {projAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        USD
                      </span>
                    </div>
                  </div>

                  {/* Tasks nested checklist under Project */}
                  <div className='divide-y divide-stone-100 text-[11px] leading-relaxed'>
                    {(
                      Object.values(group.descriptions) as {
                        mins: number;
                        description: string;
                        tags: string[];
                      }[]
                    ).map((item, dIdx) => {
                      const itemAmount = (item.mins / 60) * hourlyRate;
                      return (
                        <div
                          key={dIdx}
                          className='px-4 py-2 flex justify-between items-center hover:bg-stone-50/50'
                        >
                          <div className='space-y-0.5 max-w-[70%]'>
                            <p className='font-semibold text-stone-800 break-words'>
                              {item.description}
                            </p>
                            {item.tags.length > 0 && (
                              <div className='flex gap-1'>
                                {item.tags.map((t, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className='px-1 border border-stone-200 bg-stone-100 rounded text-[8px] text-stone-500 font-medium'
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className='flex items-center gap-4 font-mono font-medium text-stone-600'>
                            <span>{formatMinutesHHMM(item.mins)}</span>
                            <span className='text-stone-900 font-bold'>
                              $
                              {itemAmount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              USD
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {detailedLedgerGroups.length === 0 && (
              <div className='p-8 text-center text-stone-400 italic'>
                No workspace time records logged.
              </div>
            )}
          </div>
        </section>

        {/* PDF Doc Workspace Footer */}
        <footer className='mt-8 pt-5 border-t border-stone-200 flex justify-between items-center text-[9px] font-mono text-stone-400'>
          <span>Dczii's workspace</span>
          <span>Created with Tyme</span>
          <span>Approved Invoice Copy</span>
        </footer>
      </div>
    </div>
  );
}
