const grievanceStatusUpdateTemplate = (name, grievanceId, newStatus, comment) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50;">Grievance Status Updated</h2>
        <p>Dear <strong>${name}</strong>,</p>
 
        <p>Your grievance with the following ID has been updated:</p>
 
        <div style="background-color: #ecf0f1; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px;"><strong>Grievance ID:</strong> ${grievanceId}</p>
          <p style="margin: 0; font-size: 16px;"><strong>New Status:</strong> <span style="color: #27ae60;">${newStatus}</span></p>
        </div>
 
        ${
          comment
            ? `<p><strong>Officer's Comment:</strong> ${comment}</p>`
            : ""
        }
 
        <p>You can log in to your dashboard anytime to view more details and follow up if needed.</p>
 
        <p style="margin-top: 30px;">Warm regards,<br/>Grievance Redressal Team</p>
 
        <hr style="margin-top: 30px;" />
        <p style="font-size: 12px; color: #888;">This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `;
};
 
module.exports = grievanceStatusUpdateTemplate;