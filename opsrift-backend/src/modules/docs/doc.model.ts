import { Schema, model, Document, Types } from "mongoose";

export interface IDoc extends Document {
  taskId: Types.ObjectId;
  submittedBy: Types.ObjectId;
  notes: string;
  outcome: "Completed" | "Partially Completed" | "Blocked";
  createdAt: Date;
}

const DocSchema = new Schema<IDoc>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    notes: { type: String, required: true, trim: true },
    outcome: {
      type: String,
      enum: ["Completed", "Partially Completed", "Blocked"],
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export default model<IDoc>("Doc", DocSchema);
