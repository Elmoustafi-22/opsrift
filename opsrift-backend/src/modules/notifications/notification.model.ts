import { Schema, model, Document, Types } from "mongoose";

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: "MESSAGE" | "ANNOUNCEMENT";
  title: string;
  body: string;
  link?: string;
  referenceId?: Types.ObjectId;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["MESSAGE", "ANNOUNCEMENT"],
      required: true,
      default: "MESSAGE",
    },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    link: { type: String, trim: true },
    referenceId: { type: Schema.Types.ObjectId, ref: "Task" },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export default model<INotification>("Notification", NotificationSchema);
