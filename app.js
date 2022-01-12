import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { connectToMongo } from "./mongo.js";

import { add, startOfDay, differenceInDays, format } from "date-fns";

dotenv.config();

console.log("info", process.env.MONGO_URI_PROD);

try {
  console.log("starting signup");
  const db = await connectToMongo();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "paul.stocks@gmail.com",
      pass: process.env.PW,
    },
  });

  const signups = await db
    .collection("signups")
    .find({ emailSent: false })
    .sort({ when: 1 })
    .toArray();
  if (signups.length !== 0) {
    for (const mem of signups) {
      let info = await transporter.sendMail({
        from: "paul.stocks@gmail.com",
        to: ["paul.stocks@gmail.com", "cap.stocks@gmail.com"], // An array if you have multiple recipients.
        subject: `MatchClub Signup`,
        "h:Reply-To": "paul.stocks@gmail.com",
        html: `<html>
                         <p>${mem.name} ${
          mem.what === "add" ? "signed up for the" : "dropped out of the"
        } ${format(mem.date, "MM/dd/yyyy")} match at ${mem.location}.</p>
                        <p>This was done at ${format(
                          mem.when,
                          "h:mma MM/dd/yyyy"
                        )}.</p>
                         </html>`,
      });

      console.log("Message sent: %s", info.messageId);
      // update db to email sent
      //   db.collection("signups").updateOne(
      //     { _id },
      //     { $set: { emailSent: true } }
      //   );
    }
    const ids = signups.map((v) => v._id);

    const result = await db.collection("signups").updateMany(
      { _id: { $in: ids } },
      { $set: { emailSent: true } }
    );
  } else {
    console.log("no emails to send");
  }

  // update db so we don't do it again
  // await db
  //   .collection("emailSent")
  //   .insertOne({ when: new Date(), who: all });
  console.log("we are done!");
  process.exit(0);
} catch (error) {
  console.log("signup exception", error);
  process.exit(1);
}
