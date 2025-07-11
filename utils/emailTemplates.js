exports.getWelcomeEmailTemplate = (name) => {
    return `
    <div style = "max-width: 600px; margin: auto; padding: 20px;  background:#f8f9fa; font-family:sans-serif; border-radius:10px;">
    <div style="text-align: center; padding: 20px; 0;">
    <h2 style="color: #0B5ED7;">Welcome to CPGRAMS, ${name}!</h2>
    </div>
    <div style="background:white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <p style="font-size: 16px; color: #212529; line-height: 1.5;">
    Thank you for registering on the <strong>Centralized public Grivience Readress and Moitoring system (CPGRAMS)</strong>We are excited to have you on board! Our platform is designed to help you easily manage and resolve your grievances.
    </p>
    <p style="font-size: 16px; color: #212529; line-height: 1.5;">
    You can now lodge griviences, track their progress, and receive updates from departments seamlessly.
    </p>
    <p style="font-size: 16px; color: #212529; line-height: 1.5;">
    If you have any questions or need assistance, feel free to reach out to our support team.
    </p>
    <br/>
    <p style="font-size: 16px; color: #212529; line-height: 1.5;">
    Best regards,<br/>
    <strong>CPGRAMS Team</strong>
    </p>
    </div>
    <div style="text-align: center; padding: 10px; color: #6c757d; font-size: 12px; margin-top: 20px;">
    <p>© ${new Date().getFullYear()} CPGRAMS. All rights reserved.</p>
    </div>
    </div>
    `;
};