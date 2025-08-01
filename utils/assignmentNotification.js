const assignmentNotificationTemplate = (recipientName, grievanceId, assignedByName, assignedToName, isRecipientOfficer) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50;">Grievance Assignment ${isRecipientOfficer ? "Notification" : "Confirmation"}</h2>
        <p>Dear <strong>${recipientName}</strong>,</p>
 
        ${
          isRecipientOfficer
            ? `<p>You have been assigned a new grievance to handle by <strong>${assignedByName}</strong>.</p>`
            : `<p>You have successfully assigned the grievance to <strong>${assignedToName}</strong>.</p>`
        }
 
        <div style="background-color: #ecf0f1; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px;"><strong>Grievance ID:</strong> ${grievanceId}</p>
          <p style="margin: 0; font-size: 16px;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
 
        <p>Please log in to your dashboard to view more details.</p>
 
        <p style="margin-top: 30px;">Regards,<br/>Grievance Redressal System</p>
 
        <hr style="margin-top: 30px;" />
        <p style="font-size: 12px; color: #888;">This is an automated message. Do not reply.</p>
      </div>
    </div>
  `;
};
 
module.exports = assignmentNotificationTemplate;