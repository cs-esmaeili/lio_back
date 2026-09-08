import type { PrismaClient } from '../../src/generated/prisma/client';

export type ProductSeed = { name: string; slug: string; description: string };

export const PRODUCTS: ProductSeed[] = [
  { name: 'Wireless Headphones', slug: 'wireless-headphones', description: 'Over-ear bluetooth headphones with active noise cancellation.' },
  { name: 'Mechanical Keyboard', slug: 'mechanical-keyboard', description: 'Tenkeyless mechanical keyboard with hot-swappable switches.' },
  { name: '4K Monitor', slug: '4k-monitor', description: '27-inch 4K UHD monitor with HDR and 144Hz refresh rate.' },
  { name: 'Ergonomic Mouse', slug: 'ergonomic-mouse', description: 'Wireless ergonomic mouse with adjustable DPI.' },
  { name: 'USB-C Hub', slug: 'usb-c-hub', description: '9-in-1 USB-C hub with HDMI, ethernet, and card readers.' },
  { name: 'Laptop Stand', slug: 'laptop-stand', description: 'Aluminum adjustable laptop stand for improved ergonomics.' },
  { name: 'Smart Watch', slug: 'smart-watch', description: 'Fitness tracker with heart-rate, sleep, and GPS tracking.' },
  { name: 'Bluetooth Speaker', slug: 'bluetooth-speaker', description: 'Portable water-resistant bluetooth speaker with deep bass.' },
];

export async function seedProducts(prisma: PrismaClient): Promise<number> {
  for (const product of PRODUCTS) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      create: product,
      update: { name: product.name, description: product.description },
    });
  }

  return prisma.product.count();
}
