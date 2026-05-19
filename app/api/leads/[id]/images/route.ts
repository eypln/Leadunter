import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { leadRepository } from '@/lib/repositories/lead-repository';
import { downloadAndStoreImages } from '@/lib/images/image-downloader';
import { supabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

// Validate UUID format to prevent injection
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Auth check
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ success: false, error: 'Invalid lead ID' }, { status: 400 });
  }

  try {
    const lead = await leadRepository.getLeadById(id);

    if (lead.images_downloaded) {
      return NextResponse.json({
        success: true,
        message: 'Images already downloaded',
        data: { alreadyDownloaded: true },
      });
    }

    if (!lead.image_urls || lead.image_urls.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No images available for this lead',
      }, { status: 400 });
    }

    // Download + upload to Supabase Storage
    const storedPaths = await downloadAndStoreImages(id, lead.image_urls);

    if (storedPaths.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to download any images',
      }, { status: 502 });
    }

    // Persist image records in lead_images table
    const imageRecords = storedPaths.map((path) => ({
      lead_id: id,
      storage_path: path,
      url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/lead-images/${path}`,
    }));

    await supabaseAdmin.from('lead_images').insert(imageRecords);

    // Mark lead as having images downloaded
    await leadRepository.markImagesDownloaded(id);

    return NextResponse.json({
      success: true,
      message: `Downloaded ${storedPaths.length} of ${lead.image_urls.length} images`,
      data: { downloaded: storedPaths.length, total: lead.image_urls.length },
    });
  } catch (error) {
    console.error('Image download error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to download images',
      },
      { status: 500 }
    );
  }
}
