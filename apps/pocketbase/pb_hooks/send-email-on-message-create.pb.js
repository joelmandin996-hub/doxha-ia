/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  try {
    const channel = e.record.get("channel");
    
    // Only process email channel messages
    if (channel !== "email") {
      console.log("[send-email-on-message-create] Message " + e.record.id + " is channel '" + channel + "', skipping email send");
      e.next();
      return;
    }

    const recipientType = e.record.get("recipient_type");
    const recipientId = e.record.get("recipient_id");
    const subject = e.record.get("subject") || "Message from Doxha CRM";
    const messageText = e.record.get("message_text");

    console.log("[send-email-on-message-create] Processing email message " + e.record.id + " to " + recipientType + " " + recipientId);

    // Validate and fetch recipient
    let recipientEmail = null;
    let recipientName = null;

    if (recipientType === "member") {
      try {
        const member = $app.findRecordById("members", recipientId);
        if (!member) {
          throw new BadRequestError("Member with ID '" + recipientId + "' does not exist");
        }

        recipientEmail = member.get("email");
        recipientName = member.get("name");

        if (!recipientEmail) {
          throw new BadRequestError("Member '" + recipientName + "' does not have a valid email address");
        }

        console.log("[send-email-on-message-create] Resolved member: " + recipientName + " (" + recipientEmail + ")");
      } catch (memberError) {
        console.error("[send-email-on-message-create] Error fetching member: " + memberError.message);
        throw memberError;
      }
    } else if (recipientType === "group") {
      try {
        const group = $app.findRecordById("groups", recipientId);
        if (!group) {
          throw new BadRequestError("Group with ID '" + recipientId + "' does not exist");
        }

        recipientName = group.get("name");
        console.log("[send-email-on-message-create] Resolved group: " + recipientName);
        
        // For groups, fetch all members and send to each
        const groupMembers = $app.findAllRecords("group_members", { filter: "group_id = '" + recipientId + "'" });
        
        if (!groupMembers || groupMembers.length === 0) {
          console.warn("[send-email-on-message-create] Group '" + recipientName + "' has no members, skipping email send");
          e.next();
          return;
        }

        let successCount = 0;
        let failureCount = 0;

        for (let i = 0; i < groupMembers.length; i++) {
          const groupMember = groupMembers[i];
          const memberId = groupMember.get("member_id");
          
          try {
            const member = $app.findRecordById("members", memberId);
            if (!member) {
              console.warn("[send-email-on-message-create] Member " + memberId + " in group not found, skipping");
              failureCount++;
              continue;
            }

            const memberEmail = member.get("email");
            const memberName = member.get("name");

            if (!memberEmail || !memberEmail.includes("@")) {
              console.warn("[send-email-on-message-create] Member '" + memberName + "' has invalid email, skipping");
              failureCount++;
              continue;
            }

            // Send email to group member
            const message = new MailerMessage({
              from: {
                address: "contact@doxha.com",
                name: "Doxha"
              },
              to: [{ address: memberEmail }],
              subject: subject,
              html: "<h2>" + subject + "</h2><p>" + messageText + "</p><p style='margin-top: 20px; color: #666; font-size: 12px;'>---<br>Sent via Doxha CRM</p>"
            });

            $app.newMailClient().send(message);
            console.log("[send-email-on-message-create] Email sent to " + memberEmail + " (member: " + memberName + ", group: " + recipientName + ")");
            successCount++;
          } catch (sendError) {
            console.error("[send-email-on-message-create] Failed to send email to member " + memberId + ": " + sendError.message);
            failureCount++;
          }
        }

        console.log("[send-email-on-message-create] Group email completed - Sent: " + successCount + ", Failed: " + failureCount);
        e.next();
        return;
      } catch (groupError) {
        console.error("[send-email-on-message-create] Error processing group: " + groupError.message);
        throw groupError;
      }
    } else {
      throw new BadRequestError("Invalid recipient_type: '" + recipientType + "'. Must be 'member' or 'group'");
    }

    // Send email to individual member
    if (!recipientEmail || !recipientEmail.includes("@")) {
      throw new BadRequestError("Invalid email address for recipient: '" + recipientEmail + "'");
    }

    const message = new MailerMessage({
      from: {
        address: "contact@doxha.com",
        name: "Doxha"
      },
      to: [{ address: recipientEmail }],
      subject: subject,
      html: "<h2>" + subject + "</h2><p>" + messageText + "</p><p style='margin-top: 20px; color: #666; font-size: 12px;'>---<br>Sent via Doxha CRM</p>"
    });

    $app.newMailClient().send(message);
    console.log("[send-email-on-message-create] Email sent successfully to " + recipientEmail + " (Message ID: " + e.record.id + ")");

  } catch (error) {
    console.error("[send-email-on-message-create] Error: " + error.message);
    throw new BadRequestError("Failed to send email: " + error.message);
  }

  e.next();
}, "messages");