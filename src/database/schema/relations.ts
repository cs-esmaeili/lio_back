import { relations } from 'drizzle-orm';
import { addresses } from './address';
import { attributeValues } from './attribute-value';
import { attributes } from './attribute';
import { authSessions } from './auth-session';
import { bannerSections } from './banner-section';
import { categories } from './category';
import { categoryAttributes } from './category-attribute';
import { files } from './file';
import { footerSections } from './footer-section';
import { headerSections } from './header-section';
import { introductionSections } from './introduction-section';
import { locations } from './location';
import { pageSections } from './page-section';
import { pages } from './page';
import { permissions } from './permission';
import { productAttributeValues } from './product-attribute-value';
import { productCategories } from './product-category';
import { productImages } from './product-image';
import { productListSections } from './product-list-section';
import { productTags } from './product-tag';
import { productVariants } from './product-variant';
import { products } from './product';
import { rolePermissions } from './role-permission';
import { roles } from './role';
import { sliderSections } from './slider-section';
import { tags } from './tag';
import { users } from './user';
import { variantAttributeValues } from './variant-attribute-value';

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
  addresses: many(addresses),
  files: many(files),
  sessions: many(authSessions),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  permissions: many(rolePermissions),
  users: many(users),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, { fields: [authSessions.userId], references: [users.id] }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
  location: one(locations, { fields: [addresses.locationId], references: [locations.id] }),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  addresses: many(addresses),
}));

export const filesRelations = relations(files, ({ one, many }) => ({
  uploader: one(users, { fields: [files.uploaderId], references: [users.id] }),
  categoryImages: many(categories),
  tagImages: many(tags),
  productImages: many(productImages),
  sliderDesktopSections: many(sliderSections, { relationName: 'SliderDesktopFile' }),
  sliderTabletSections: many(sliderSections, { relationName: 'SliderTabletFile' }),
  sliderMobileSections: many(sliderSections, { relationName: 'SliderMobileFile' }),
  bannerDesktopSections: many(bannerSections, { relationName: 'BannerDesktopFile' }),
  bannerTabletSections: many(bannerSections, { relationName: 'BannerTabletFile' }),
  bannerMobileSections: many(bannerSections, { relationName: 'BannerMobileFile' }),
  introductionDesktopSections: many(introductionSections, { relationName: 'IntroductionDesktopFile' }),
  introductionTabletSections: many(introductionSections, { relationName: 'IntroductionTabletFile' }),
  introductionMobileSections: many(introductionSections, { relationName: 'IntroductionMobileFile' }),
  footerSections: many(footerSections, { relationName: 'FooterFile' }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id], relationName: 'CategoryTree' }),
  children: many(categories, { relationName: 'CategoryTree' }),
  image: one(files, { fields: [categories.imageId], references: [files.id] }),
  products: many(productCategories),
  categoryAttributes: many(categoryAttributes),
  headerSections: many(headerSections),
  footerSections: many(footerSections),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  parent: one(tags, { fields: [tags.parentId], references: [tags.id], relationName: 'TagTree' }),
  children: many(tags, { relationName: 'TagTree' }),
  image: one(files, { fields: [tags.imageId], references: [files.id] }),
  products: many(productTags),
}));

export const productsRelations = relations(products, ({ many }) => ({
  categories: many(productCategories),
  tags: many(productTags),
  attributeValues: many(productAttributeValues),
  images: many(productImages),
  variants: many(productVariants),
  productListSections: many(productListSections),
}));

export const productCategoriesRelations = relations(productCategories, ({ one }) => ({
  product: one(products, { fields: [productCategories.productId], references: [products.id] }),
  category: one(categories, { fields: [productCategories.categoryId], references: [categories.id] }),
}));

export const productTagsRelations = relations(productTags, ({ one }) => ({
  product: one(products, { fields: [productTags.productId], references: [products.id] }),
  tag: one(tags, { fields: [productTags.tagId], references: [tags.id] }),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
  file: one(files, { fields: [productImages.fileId], references: [files.id] }),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  variantAttributeValues: many(variantAttributeValues),
}));

export const productAttributeValuesRelations = relations(productAttributeValues, ({ one, many }) => ({
  product: one(products, { fields: [productAttributeValues.productId], references: [products.id] }),
  attribute: one(attributes, { fields: [productAttributeValues.attributeId], references: [attributes.id] }),
  attributeValue: one(attributeValues, { fields: [productAttributeValues.attributeValueId], references: [attributeValues.id] }),
  variantAttributeValues: many(variantAttributeValues),
}));

export const variantAttributeValuesRelations = relations(variantAttributeValues, ({ one }) => ({
  variant: one(productVariants, { fields: [variantAttributeValues.variantId], references: [productVariants.id] }),
  productAttributeValue: one(productAttributeValues, {
    fields: [variantAttributeValues.productAttributeValueId],
    references: [productAttributeValues.id],
  }),
}));

export const attributesRelations = relations(attributes, ({ many }) => ({
  values: many(attributeValues),
  categoryAttributes: many(categoryAttributes),
  productAttributeValues: many(productAttributeValues),
}));

export const attributeValuesRelations = relations(attributeValues, ({ one, many }) => ({
  attribute: one(attributes, { fields: [attributeValues.attributeId], references: [attributes.id] }),
  productAttributeValues: many(productAttributeValues),
}));

export const categoryAttributesRelations = relations(categoryAttributes, ({ one }) => ({
  category: one(categories, { fields: [categoryAttributes.categoryId], references: [categories.id] }),
  attribute: one(attributes, { fields: [categoryAttributes.attributeId], references: [attributes.id] }),
}));

export const pagesRelations = relations(pages, ({ many }) => ({
  sections: many(pageSections),
}));

export const pageSectionsRelations = relations(pageSections, ({ one, many }) => ({
  page: one(pages, { fields: [pageSections.pageId], references: [pages.id] }),
  sliderSections: many(sliderSections),
  productListSections: many(productListSections),
  bannerSections: many(bannerSections),
  introductionSection: one(introductionSections, { fields: [pageSections.id], references: [introductionSections.sectionId] }),
  headerSections: many(headerSections),
  footerSections: many(footerSections),
}));

export const sliderSectionsRelations = relations(sliderSections, ({ one }) => ({
  section: one(pageSections, { fields: [sliderSections.sectionId], references: [pageSections.id] }),
  desktopFile: one(files, { fields: [sliderSections.desktopFileId], references: [files.id], relationName: 'SliderDesktopFile' }),
  tabletFile: one(files, { fields: [sliderSections.tabletFileId], references: [files.id], relationName: 'SliderTabletFile' }),
  mobileFile: one(files, { fields: [sliderSections.mobileFileId], references: [files.id], relationName: 'SliderMobileFile' }),
}));

export const bannerSectionsRelations = relations(bannerSections, ({ one }) => ({
  section: one(pageSections, { fields: [bannerSections.sectionId], references: [pageSections.id] }),
  desktopFile: one(files, { fields: [bannerSections.desktopFileId], references: [files.id], relationName: 'BannerDesktopFile' }),
  tabletFile: one(files, { fields: [bannerSections.tabletFileId], references: [files.id], relationName: 'BannerTabletFile' }),
  mobileFile: one(files, { fields: [bannerSections.mobileFileId], references: [files.id], relationName: 'BannerMobileFile' }),
}));

export const introductionSectionsRelations = relations(introductionSections, ({ one }) => ({
  section: one(pageSections, { fields: [introductionSections.sectionId], references: [pageSections.id] }),
  desktopFile: one(files, {
    fields: [introductionSections.desktopFileId],
    references: [files.id],
    relationName: 'IntroductionDesktopFile',
  }),
  tabletFile: one(files, {
    fields: [introductionSections.tabletFileId],
    references: [files.id],
    relationName: 'IntroductionTabletFile',
  }),
  mobileFile: one(files, {
    fields: [introductionSections.mobileFileId],
    references: [files.id],
    relationName: 'IntroductionMobileFile',
  }),
}));

export const headerSectionsRelations = relations(headerSections, ({ one }) => ({
  section: one(pageSections, { fields: [headerSections.sectionId], references: [pageSections.id] }),
  category: one(categories, { fields: [headerSections.categoryId], references: [categories.id] }),
}));

export const footerSectionsRelations = relations(footerSections, ({ one }) => ({
  section: one(pageSections, { fields: [footerSections.sectionId], references: [pageSections.id] }),
  file: one(files, { fields: [footerSections.fileId], references: [files.id], relationName: 'FooterFile' }),
  category: one(categories, { fields: [footerSections.categoryId], references: [categories.id] }),
}));

export const productListSectionsRelations = relations(productListSections, ({ one }) => ({
  section: one(pageSections, { fields: [productListSections.sectionId], references: [pageSections.id] }),
  product: one(products, { fields: [productListSections.productId], references: [products.id] }),
}));
