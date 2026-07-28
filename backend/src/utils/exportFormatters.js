// Column definitions + row-shaping helpers shared by the search-results
// export and the analytics report exports (export.service.js consumes
// both the same way, whether the destination is XLSX or PDF).

const APPLICATION_EXPORT_COLUMNS = [
  { header: 'Application #', key: 'applicationNumber', width: 20 },
  { header: 'Applicant', key: 'applicant', width: 22 },
  { header: 'Registration/Employee #', key: 'applicantIdentifier', width: 20 },
  { header: 'Type', key: 'type', width: 20 },
  { header: 'Department', key: 'department', width: 18 },
  { header: 'Supervisor', key: 'supervisor', width: 20 },
  { header: 'Assigned Officer', key: 'assignedOfficer', width: 20 },
  { header: 'Priority', key: 'priority', width: 10 },
  { header: 'Status', key: 'status', width: 22 },
  { header: 'Submitted', key: 'submittedAt', width: 18 },
  { header: 'Deadline', key: 'deadlineAt', width: 18 },
];

const DEPARTMENT_REPORT_COLUMNS = [
  { header: 'Department', key: 'departmentName', width: 25 },
  { header: 'Total', key: 'total', width: 10 },
  { header: 'Approved', key: 'approved', width: 10 },
  { header: 'Rejected', key: 'rejected', width: 10 },
  { header: 'Pending', key: 'pending', width: 10 },
  { header: 'Overdue', key: 'overdue', width: 10 },
  { header: 'Avg Resolution (hrs)', key: 'avgResolutionHours', width: 20 },
  { header: 'Escalation Frequency', key: 'escalationCount', width: 20 },
];

const SUPERVISOR_REPORT_COLUMNS = [
  { header: 'Supervisor', key: 'supervisorName', width: 25 },
  { header: 'Department', key: 'department', width: 20 },
  { header: 'Total', key: 'total', width: 10 },
  { header: 'Approved', key: 'approved', width: 10 },
  { header: 'Rejected', key: 'rejected', width: 10 },
  { header: 'Pending', key: 'pending', width: 10 },
  { header: 'Avg Resolution (hrs)', key: 'avgResolutionHours', width: 20 },
];

const OVERVIEW_REPORT_COLUMNS = [
  { header: 'Metric', key: 'metric', width: 32 },
  { header: 'Value', key: 'value', width: 15 },
];

function fmtDate(d) {
  return d ? new Date(d).toISOString().slice(0, 16).replace('T', ' ') : '';
}

function toApplicationRow(app) {
  return {
    applicationNumber: app.applicationNumber,
    applicant: app.applicant?.fullName || '',
    applicantIdentifier: app.applicant?.registrationNumber || app.applicant?.employeeId || '',
    type: app.applicationType?.name || '',
    department: app.department?.name || '',
    supervisor: app.supervisor?.fullName || '',
    assignedOfficer: app.assignedOfficer?.fullName || '',
    priority: app.priority,
    status: app.status,
    submittedAt: fmtDate(app.submittedAt),
    deadlineAt: fmtDate(app.deadlineAt),
  };
}

module.exports = {
  APPLICATION_EXPORT_COLUMNS,
  DEPARTMENT_REPORT_COLUMNS,
  SUPERVISOR_REPORT_COLUMNS,
  OVERVIEW_REPORT_COLUMNS,
  toApplicationRow,
  fmtDate,
};
