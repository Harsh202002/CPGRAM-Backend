const reminderNotificationTemplate = (recipientName, grievanceId, senderName) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
      <div style="max-width: 600px; margin: auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #d35400;">Reminder Notification</h2>
        <p>Dear <strong>${recipientName}</strong>,</p>
 
        <p>This is a gentle reminder regarding the grievance below:</p>
 
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px;"><strong>Grievance ID:</strong> ${grievanceId}</p>
          <p style="margin: 0; font-size: 16px;"><strong>Sent By:</strong> ${senderName}</p>
          <p style="margin: 0; font-size: 16px;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
 
        <p>Please review and take necessary actions as soon as possible.</p>
 
        <p style="margin-top: 30px;">Regards,<br/>Grievance Redressal System</p>
 
        <hr style="margin-top: 30px;" />
        <p style="font-size: 12px; color: #888;">This is an automated email. Do not reply.</p>
      </div>
    </div>
  `;
};
 
module.exports = reminderNotificationTemplate;