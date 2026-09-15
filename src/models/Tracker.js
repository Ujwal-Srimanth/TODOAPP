const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ['number', 'text', 'checkbox', 'amount'],
      required: true,
    },
    value: mongoose.Schema.Types.Mixed,
    tag: { type: String, default: 'Others' },
  },
  { _id: false }
);

const dailyRecordSchema = new mongoose.Schema(
  {
    userId: { type: String, default: 'default-user' },
    date: { type: String, required: true },
    entries: { type: Map, of: entrySchema, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    collection: 'dailyRecords',
  }
);

const customEventSchema = new mongoose.Schema(
  {
    userId: { type: String, default: 'default-user' },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ['number', 'text', 'checkbox', 'amount'],
      default: 'text',
    },
    recurrenceType: {
      type: String,
      enum: ['daily', 'weekly'],
      default: 'daily',
    },
    selectedDays: {
      type: [String],
      default: [],
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: 'customEvents',
  }
);

const expenseSchema = new mongoose.Schema(
  {
    userId: { type: String, default: 'default-user' },
    date: { type: String, required: true },
    label: { type: String, required: true },
    amount: { type: Number, required: true },
    tag: { type: String, default: 'Others' },
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: 'expenses',
  }
);

const DailyRecord = mongoose.models.DailyRecord || mongoose.model('DailyRecord', dailyRecordSchema);
const CustomEvent = mongoose.models.CustomEvent || mongoose.model('CustomEvent', customEventSchema);
const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

module.exports = { DailyRecord, CustomEvent, Expense };
