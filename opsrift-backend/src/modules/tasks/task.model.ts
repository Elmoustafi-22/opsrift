import { Schema, model, Document, Types } from "mongoose";

export interface ITask extends Document {
  title: string;
  description?: string;
  aiBreakdown?: string;
  status: "pending" | "inprogress" | "done" | "overdue";
  assignedTo: Types.ObjectId;
  createdBy: Types.ObjectId;
  dueDate: Date;
  docAttached: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "inprogress", "done", "overdue"],
      default: "pending",
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date, required: true },
    docAttached: { type: Boolean, default: false },
    aiBreakdown: { type: String },
  },
  {
    timestamps: true,
  }
);

export default model<ITask>("Task", TaskSchema);
