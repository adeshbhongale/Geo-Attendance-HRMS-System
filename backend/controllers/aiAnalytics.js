const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Leave = require('../models/Leave');
const model = require('../config/gemini');

// @desc    Get AI-Powered Business Analytics
// @route   GET /api/ai/analytics
// @access  Private/Admin
exports.getAIAnalytics = async (req, res, next) => {
  try {
    // 1. Fetch Aggregated Data for the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const attendanceRecords = await Attendance.find({
      date: { $gte: thirtyDaysAgo, $lte: now }
    }).populate('user', 'name department');

    const leaveRecords = await Leave.find({
      createdAt: { $gte: thirtyDaysAgo, $lte: now }
    });

    // 2. Calculate Summary Metrics
    const totalPresent = attendanceRecords.length;
    const lateCount = attendanceRecords.filter(r => r.status === 'Late').length;
    const halfDayCount = attendanceRecords.filter(r => r.status === 'Half Day').length;
    const totalWorkingHours = attendanceRecords.reduce((acc, r) => acc + (r.workingHours || 0), 0);
    const avgWorkingHours = totalPresent > 0 ? (totalWorkingHours / totalPresent).toFixed(2) : 0;
    const geoViolations = attendanceRecords.filter(r => r.isOutside).length;
    
    const approvedLeaves = leaveRecords.filter(r => r.status === 'Approved').length;
    const rejectedLeaves = leaveRecords.filter(r => r.status === 'Rejected').length;

    // Department Breakdown
    const deptStats = {};
    attendanceRecords.forEach(r => {
      const dept = r.user?.department || 'General';
      if (!deptStats[dept]) deptStats[dept] = { present: 0, late: 0 };
      deptStats[dept].present++;
      if (r.status === 'Late') deptStats[dept].late++;
    });

    const deptSummary = Object.entries(deptStats).map(([name, stats]) => 
      `${name}: ${stats.present} present, ${stats.late} late`
    ).join('\n');

    // 3. Calculate Individual Employee Scores (Multi-Factor)
    const employeeMetrics = {};
    const employees = await User.find({ role: 'employee' });
    
    employees.forEach(emp => {
      employeeMetrics[emp._id] = {
        name: emp.name,
        department: emp.department || 'General',
        present: 0,
        late: 0,
        hours: 0,
        halfDays: 0,
        geoViolations: 0,
        totalBreakMinutes: 0,
        approvedLeaves: 0,
        rejectedLeaves: 0
      };
    });

    attendanceRecords.forEach(r => {
      if (employeeMetrics[r.user?._id]) {
        const m = employeeMetrics[r.user._id];
        m.present++;
        if (r.status === 'Late') m.late++;
        if (r.status === 'Half Day') m.halfDays++;
        if (r.isOutside) m.geoViolations++;
        m.hours += (r.workingHours || 0);
        
        // Break Time Aggregation
        if (r.breaks && r.breaks.length > 0) {
          m.totalBreakMinutes += r.breaks.reduce((sum, b) => sum + (b.duration || 0), 0);
        }
      }
    });

    leaveRecords.forEach(l => {
      if (employeeMetrics[l.user]) {
        if (l.status === 'Approved') employeeMetrics[l.user].approvedLeaves++;
        if (l.status === 'Rejected') employeeMetrics[l.user].rejectedLeaves++;
      }
    });

    const employeeScores = Object.values(employeeMetrics).map(m => {
      // 1. Attendance Score (Max 25)
      const attendanceScore = (Math.min(25, (m.present / 26) * 25)); // Baseline 26 workdays

      // 2. Punctuality Score (Max 20)
      const punctualityScore = m.present > 0 ? (20 - (m.late / m.present) * 20) : 0;

      // 3. Geo-Compliance Score (Max 15)
      const geoScore = m.present > 0 ? (15 - (m.geoViolations / m.present) * 15) : 15;

      // 4. Work Duration Score (Max 15)
      const avgHrs = m.present > 0 ? (m.hours / m.present) : 0;
      const hoursScore = Math.min(15, (avgHrs / 8) * 15);

      // 5. Break Efficiency (Max 10) - Penalty if breaks > 60 mins/day on avg
      const avgBreak = m.present > 0 ? (m.totalBreakMinutes / m.present) : 0;
      const breakScore = Math.max(0, 10 - (Math.max(0, avgBreak - 60) / 30) * 10);

      // 6. Discipline (Leaves & Half Days) (Max 15)
      const halfDayPenalty = m.halfDays * 2;
      const leavePenalty = m.rejectedLeaves * 3;
      const disciplineScore = Math.max(0, 15 - (halfDayPenalty + leavePenalty));

      const overallScore = Math.round(attendanceScore + punctualityScore + geoScore + hoursScore + breakScore + disciplineScore);

      let recommendation = "Maintain consistency.";
      if (overallScore > 90) recommendation = "Exceptional performance. Leadership candidate.";
      else if (overallScore < 50) recommendation = "Performance PIP required. Multiple violations.";
      else if (geoScore < 10) recommendation = "Requires geo-fence compliance training.";
      else if (punctualityScore < 12) recommendation = "Review shift adherence patterns.";
      else if (breakScore < 7) recommendation = "Optimize break time usage.";

      return {
        ...m,
        overallScore,
        recommendation,
        avgHrs: avgHrs.toFixed(1)
      };
    }).sort((a, b) => b.overallScore - a.overallScore);

    // 4. Prepare AI Prompt with batch data
    const topPerformers = employeeScores.slice(0, 3).map(e => `${e.name} (${e.overallScore}%)`).join(', ');
    const bottomPerformers = employeeScores.slice(-3).map(e => `${e.name} (${e.overallScore}%)`).join(', ');

    const analyticsSummary = `
Workforce Analytics Summary (Last 30 Days)
Total Employees: ${totalEmployees}
Total Attendance Logs: ${totalPresent}
Total Late Arrivals: ${lateCount}
Total Half Days: ${halfDayCount}
Average Working Hours: ${avgWorkingHours}h
Geo-Fence Compliance Violations: ${geoViolations}
Leaves (Approved/Rejected): ${approvedLeaves}/${rejectedLeaves}

Top Performers: ${topPerformers}
Bottom Performers: ${bottomPerformers}

Department Breakdown:
${deptSummary}

INSTRUCTIONS:
Generate professional AI-Powered Business Analytics in EXACTLY this JSON format:
{
  "attendanceScore": number,
  "punctualityScore": number,
  "consistency": "High" | "Medium" | "Low",
  "departmentInsights": "string",
  "hrRecommendations": ["string"],
  "workforceSummary": "string",
  "reliabilityScore": number
}

IMPORTANT: Return ONLY the raw JSON object. Do not include markdown code blocks, do not include any other text.
`;

    // 4. Send to Gemini
    const result = await model.generateContent(analyticsSummary);
    const response = await result.response;
    const responseText = response.text();
    

    // Clean up response (Gemini sometimes adds markdown blocks like ```json ... ```)
    let aiData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseErr) {
      // Fallback data if AI fails to return valid JSON
      aiData = {
        attendanceScore: 75,
        punctualityScore: 70,
        consistency: "Medium",
        departmentInsights: "AI processing encountered a format error. Basic metrics show stable attendance patterns.",
        hrRecommendations: ["Review morning punctuality logs", "Monitor department-wise shifts"],
        workforceSummary: "Workforce is performing within expected parameters, though data insights are partially limited.",
        reliabilityScore: 72
      };
    }

    res.status(200).json({
      success: true,
      data: aiData,
      summary: {
        totalEmployees,
        avgWorkingHours,
        lateCount,
        geoViolations
      },
      employeeScores
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate AI analytics. Check your Gemini API Key.',
      error: err.message 
    });
  }
};
