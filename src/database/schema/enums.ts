import { pgEnum } from 'drizzle-orm/pg-core';

export const AttributeUsage = {
  SPEC: 'SPEC',
  VARIANT: 'VARIANT',
} as const;
export type AttributeUsage = (typeof AttributeUsage)[keyof typeof AttributeUsage];
export const attributeUsage = pgEnum('AttributeUsage', Object.values(AttributeUsage) as [AttributeUsage, ...AttributeUsage[]]);

export const FilterType = {
  CHECKBOX: 'CHECKBOX',
  RADIO: 'RADIO',
  SELECT: 'SELECT',
  RANGE: 'RANGE',
  TOGGLE: 'TOGGLE',
  SEARCH: 'SEARCH',
} as const;
export type FilterType = (typeof FilterType)[keyof typeof FilterType];
export const filterType = pgEnum('FilterType', Object.values(FilterType) as [FilterType, ...FilterType[]]);

export const EntityType = {
  PRODUCT: 'PRODUCT',
  CATEGORY: 'CATEGORY',
  TAG: 'TAG',
  POST: 'POST',
  BRAND: 'BRAND',
  PAGE: 'PAGE',
  HOME: 'HOME',
} as const;
export type EntityType = (typeof EntityType)[keyof typeof EntityType];
export const entityType = pgEnum('EntityType', Object.values(EntityType) as [EntityType, ...EntityType[]]);

export const FooterSectionType = {
  LINK: 'LINK',
  CATEGORY: 'CATEGORY',
} as const;
export type FooterSectionType = (typeof FooterSectionType)[keyof typeof FooterSectionType];
export const footerSectionType = pgEnum('FooterSectionType', Object.values(FooterSectionType) as [FooterSectionType, ...FooterSectionType[]]);

export const HeaderSectionType = {
  LINK: 'LINK',
  CATEGORY: 'CATEGORY',
} as const;
export type HeaderSectionType = (typeof HeaderSectionType)[keyof typeof HeaderSectionType];
export const headerSectionType = pgEnum('HeaderSectionType', Object.values(HeaderSectionType) as [HeaderSectionType, ...HeaderSectionType[]]);

export const OtpPurpose = {
  LOGIN: 'LOGIN',
  RESET_PASSWORD: 'RESET_PASSWORD',
} as const;
export type OtpPurpose = (typeof OtpPurpose)[keyof typeof OtpPurpose];
export const otpPurpose = pgEnum('OtpPurpose', Object.values(OtpPurpose) as [OtpPurpose, ...OtpPurpose[]]);

export const PageSectionType = {
  SLIDER: 'SLIDER',
  PRODUCT_LIST: 'PRODUCT_LIST',
  BANNER: 'BANNER',
  INTRODUCTION: 'INTRODUCTION',
  HEADER: 'HEADER',
  FOOTER: 'FOOTER',
} as const;
export type PageSectionType = (typeof PageSectionType)[keyof typeof PageSectionType];
export const pageSectionType = pgEnum('PageSectionType', Object.values(PageSectionType) as [PageSectionType, ...PageSectionType[]]);

export const PageSectionLocation = {
  SLIDER: 'SLIDER',
  PRODUCT_LIST: 'PRODUCT_LIST',
  AMAZING_PRODUCTS: 'AMAZING_PRODUCTS',
  BANNER: 'BANNER',
  BANNER_3: 'BANNER_3',
  BANNER_4: 'BANNER_4',
  INTRODUCTION: 'INTRODUCTION',
  HEADER: 'HEADER',
  FOOTER: 'FOOTER',
} as const;
export type PageSectionLocation = (typeof PageSectionLocation)[keyof typeof PageSectionLocation];
export const pageSectionLocation = pgEnum('PageSectionLocation', Object.values(PageSectionLocation) as [PageSectionLocation, ...PageSectionLocation[]]);

export const PageSectionStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;
export type PageSectionStatus = (typeof PageSectionStatus)[keyof typeof PageSectionStatus];
export const pageSectionStatus = pgEnum('PageSectionStatus', Object.values(PageSectionStatus) as [PageSectionStatus, ...PageSectionStatus[]]);

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
  BANNED: 'BANNED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
export const userStatus = pgEnum('UserStatus', Object.values(UserStatus) as [UserStatus, ...UserStatus[]]);

export const OrderStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID: 'PAID',
  CANCELED: 'CANCELED',
  EXPIRED: 'EXPIRED',
  FAILED: 'FAILED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
export const orderStatus = pgEnum('OrderStatus', Object.values(OrderStatus) as [OrderStatus, ...OrderStatus[]]);

export const PaymentStatus = {
  INITIATED: 'INITIATED',
  VERIFIED: 'VERIFIED',
  FAILED: 'FAILED',
  CANCELED: 'CANCELED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
export const paymentStatus = pgEnum('PaymentStatus', Object.values(PaymentStatus) as [PaymentStatus, ...PaymentStatus[]]);
