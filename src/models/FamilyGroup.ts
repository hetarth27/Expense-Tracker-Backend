import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * FamilyGroup — shared account grouping for multi-user support.
 * Users can belong to one FamilyGroup. All members can view/add
 * household expenses. Personal expenses remain private.
 *
 * Currently scaffolded — activate by:
 * 1. Populating familyGroupId on User documents
 * 2. Adding a /api/family router
 * 3. Scoping household expense queries to familyGroupId instead of userId
 */
export interface IFamilyGroup extends Document {
  _id: Types.ObjectId;
  name: string;
  ownerId: Types.ObjectId;
  memberIds: Types.ObjectId[];
  inviteCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const FamilyGroupSchema = new Schema<IFamilyGroup>(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: 60,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    memberIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Short unique code for inviting members (e.g. "XK4-9TR")
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

FamilyGroupSchema.index({ inviteCode: 1 }, { unique: true });

export default mongoose.model<IFamilyGroup>('FamilyGroup', FamilyGroupSchema);
