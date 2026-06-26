import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const partner = await prisma.partner.findUnique({
      where: { slug: params.slug },
      include: {
        overrides: {
          where: { isHidden: false },
          include: {
            product: {
              include: {
                options: true
              }
            },
            optionOverrides: true
          }
        }
      }
    });

    if (!partner || !partner.isActive) {
      return NextResponse.json({ error: 'Partner not found or inactive' }, { status: 404 });
    }

    if (partner.accessCode) {
      const { cookies } = require('next/headers');
      const hasAccess = cookies().get(`partner_access_${params.slug}`);
      
      if (!hasAccess || hasAccess.value !== 'true') {
        return NextResponse.json({
          authRequired: true,
          partner: {
            id: partner.id,
            name: partner.name,
            slug: partner.slug,
            logoText: partner.logoText,
            logoSubtext: partner.logoSubtext,
            logoImageUrl: partner.logoImageUrl,
            bannerImage: partner.bannerImage,
            bannerTitle: partner.bannerTitle,
            bannerSubtitle: partner.bannerSubtitle,
            cartTitle: partner.cartTitle
          }
        });
      }
    }

    // Transform products to apply overrides
    const products = partner.overrides.map((ov) => {
      const p = ov.product;
      
      // Override basic info
      const name = ov.customName || p.name;
      const description = ov.customDesc || p.description;
      const imageUrl = ov.customImage || p.imageUrl;

      // Override options
      const options = p.options.map(opt => {
        const optionOv = ov.optionOverrides.find(oo => oo.productOptionId === opt.id);
        const finalSalePrice = optionOv?.customSalePrice ?? opt.salePrice;
        const discountRate = opt.originalPrice > finalSalePrice 
          ? Math.max(0, Math.round(((opt.originalPrice - finalSalePrice) / opt.originalPrice) * 100))
          : 0;

        return {
          ...opt,
          salePrice: finalSalePrice,
          discountRate: discountRate,
        };
      });

      return {
        ...p,
        name,
        description,
        imageUrl,
        options
      };
    });

    return NextResponse.json({
      partner: {
        id: partner.id,
        name: partner.name,
        slug: partner.slug,
        logoText: partner.logoText,
        logoSubtext: partner.logoSubtext,
        logoImageUrl: partner.logoImageUrl,
        bannerImage: partner.bannerImage,
        bannerTitle: partner.bannerTitle,
        bannerSubtitle: partner.bannerSubtitle,
        cartTitle: partner.cartTitle
      },
      products
    });
  } catch (error) {
    console.error('Fetch partner error:', error);
    return NextResponse.json({ error: 'Failed to fetch partner data' }, { status: 500 });
  }
}
