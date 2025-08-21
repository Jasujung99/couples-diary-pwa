import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { MediaItem } from '@/types';

// POST /api/diary/upload - Upload media files for diary entries
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate files
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
    
    for (const file of files) {
      if (file.size > maxFileSize) {
        return NextResponse.json(
          { error: `File ${file.name} is too large (max 10MB)` },
          { status: 400 }
        );
      }
      
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} is not allowed` },
          { status: 400 }
        );
      }
    }

    const uploadedMedia: MediaItem[] = [];
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'diary');

    // Ensure upload directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop();
      const filename = `${timestamp}-${randomString}.${extension}`;
      const filepath = join(uploadDir, filename);

      // Write file
      await writeFile(filepath, buffer);

      // Create MediaItem
      const mediaItem: MediaItem = {
        id: `${timestamp}-${randomString}`,
        type: file.type.startsWith('image/') ? 'image' : 'video',
        url: `/uploads/diary/${filename}`,
        size: file.size,
        filename: file.name,
      };

      // Generate thumbnail for images (simplified - in production you'd use a proper image processing library)
      if (file.type.startsWith('image/')) {
        mediaItem.thumbnail = mediaItem.url; // For now, use the same URL
      }

      uploadedMedia.push(mediaItem);
    }

    return NextResponse.json({
      data: uploadedMedia,
      success: true,
      message: `${uploadedMedia.length} file(s) uploaded successfully`
    });

  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}

// GET /api/diary/upload - Get upload limits and allowed types
export async function GET() {
  return NextResponse.json({
    data: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm']
    },
    success: true
  });
}