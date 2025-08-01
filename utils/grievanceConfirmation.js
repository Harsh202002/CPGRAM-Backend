const grievanceConfirmationTemplate = (name, grievanceId) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #2c3e50;">Grievance Submitted Successfully</h2>
        <p>Dear <strong>${name}</strong>,</p>
        <p>Thank you for submitting your grievance. We have successfully received your complaint and have assigned it a unique tracking ID.</p>
        
        <div style="background-color: #ecf0f1; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
          <p style="font-size: 18px; color: #2980b9;">Your Grievance ID:</p>
          <h3 style="margin: 0; color: #e74c3c;">${grievanceId}</h3>
        </div>
 
        <p>You can use this ID to track the status of your grievance at any time on our portal.</p>
        <p style="margin-top: 30px;">Best Regards,<br/>Grievance Redressal Team</p>
        <hr style="margin-top: 30px;"/>
        <p style="font-size: 12px; color: #888;">This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `;
};
 
module.exports = grievanceConfirmationTemplate;