import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { ROLE_VALUES, ROLES, USER_STATUS } from '../../common/constants.js';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      // Sema seviyesinde temel format kontrolu (asil dogrulama Zod ile).
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Gecersiz e-posta'],
    },
    // select:false -> sorgularda parola varsayilan olarak GELMEZ (sizinti onlemi).
    password: { type: String, required: true, select: false, minlength: 8 },
    role: { type: String, enum: ROLE_VALUES, default: ROLES.FARMER, index: true },
    farm: { type: Schema.Types.ObjectId, ref: 'Farm', index: true },

    // --- Profil / ekip yonetimi alanlari (Kullanicilar & Profil ekranlari) ---
    phone: { type: String, trim: true, maxlength: 30 },
    birthDate: { type: Date },
    // Insan-okur unvan: "Ziraat Sorumlusu", "Veteriner Hekim", "Operatör".
    jobTitle: { type: String, trim: true, maxlength: 120 },
    // Erisim alani ozeti: "Tüm işletme", "Tarla ve Stok", "Sürü ve Takvim".
    accessScope: { type: String, trim: true, maxlength: 160 },
    avatarUrl: { type: String, trim: true, maxlength: 300 },
    gender: { type: String, enum: ['erkek', 'kadin'], default: 'erkek' },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
      index: true,
    },

    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    // Sifre degistiginde / global cikista artar; eski JWT'leri gecersiz kilar.
    tokenVersion: { type: Number, default: 0, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      // Hassas alanlari API cikisindan kaldir.
      transform(_doc, ret) {
        delete ret.password;
        delete ret.tokenVersion;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// E-posta benzersiz (giris kimligi).
userSchema.index({ email: 1 }, { unique: true });
// Ekip listesi: ciftlik bazli.
userSchema.index({ farm: 1, status: 1 });

// Parolayi kaydetmeden once hash'le (yalnizca degistiginde).
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, env.BCRYPT_SALT_ROUNDS);
  next();
});

// Parola dogrulama (giris sirasinda).
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
