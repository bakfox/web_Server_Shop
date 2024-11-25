import mongoose from 'mongoose';

const inventorySchemaModel = new Mongoose.Schema({
  userPID: {
    type: Number,
    unique: true,
    required: true,
  },
  itemPID: {
    type: Number,
    required: true,
  },

  itemEquip: {
    type: Boolean,
    default: false,
  },

  itemName: {
    type: String,
    required: true,
  },
  itemText: {
    type: String,
    required: true,
  },
  itemImage: {
    type: String,
    required: true,
  },
  itemValue: {
    type: Number,
    required: true,
  },
  itemEffect: {
    type: Number,
    required: true,
  },
  itemType: {
    type: String,
    enum: ['HP', 'ATCK', 'DEFEND', 'MACTK'],
    required: true,
    default: 'HP',
  },
});

export default mongoose.model('inventory', inventorySchemaModel);
