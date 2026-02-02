
import React from 'react';
import { ToolCategory, Tool } from './types';

export const TOOLS: Tool[] = [
  // PDF
  { id: 'merge-pdf', name: 'Merge PDF', description: 'Combine multiple PDFs into one professional document.', icon: '📑', category: ToolCategory.PDF },
  { id: 'split-pdf', name: 'Split PDF', description: 'Separate pages into individual PDF files.', icon: '✂️', category: ToolCategory.PDF },
  { id: 'rotate-pdf', name: 'Rotate PDF', description: 'Rotate PDF pages permanently by 90, 180, or 270 degrees.', icon: '🔄', category: ToolCategory.PDF },
  { id: 'pdf-to-jpg', name: 'PDF to JPG', description: 'Convert PDF pages into high-quality JPG images.', icon: '🖼️', category: ToolCategory.PDF },
  { id: 'pdf-to-docx', name: 'PDF to Word', description: 'AI-powered conversion from PDF to editable DOCX format.', icon: '📝', category: ToolCategory.PDF },
  { id: 'ocr-pdf', name: 'OCR PDF', description: 'Convert scanned PDFs into searchable documents using AI text recognition.', icon: '🔍', category: ToolCategory.PDF },
  { id: 'compress-pdf', name: 'Compress PDF', description: 'Reduce PDF file size without losing quality.', icon: '📉', category: ToolCategory.PDF },
  
  // Image
  { id: 'crop-image', name: 'Crop Image', description: 'Crop images to perfect aspect ratios or custom dimensions with ease.', icon: '✂️', category: ToolCategory.IMAGE },
  { id: 'jpg-to-pdf', name: 'JPG to PDF', description: 'Convert images into high-quality PDF files.', icon: '🖼️', category: ToolCategory.IMAGE },
  { id: 'image-resize', name: 'Image Resize', description: 'Resize by pixels, mm, cm, or inches with DPI control.', icon: '📏', category: ToolCategory.IMAGE },
  { id: 'doc-enhancer', name: 'Doc Enhancer', description: 'Clean up mobile document photos for clear scanning.', icon: '✨', category: ToolCategory.IMAGE },
  { id: 'id-photo', name: 'Passport/ID Photo', description: 'Auto-preset sizes for global identification standards.', icon: '👤', category: ToolCategory.IMAGE },

  // Resume
  { id: 'resume-analyzer', name: 'Resume Analyzer', description: 'Get ATS score, feedback, and skill gap analysis.', icon: '📝', category: ToolCategory.RESUME },
  { id: 'job-match', name: 'JD Match', description: 'Compare your resume against any job description.', icon: '🎯', category: ToolCategory.RESUME },

  // Content
  { id: 'video-ideas', name: 'Video Ideas', description: 'Generate high-engagement ideas for YouTube & Reels.', icon: '🎬', category: ToolCategory.CONTENT },
  { id: 'hashtag-gen', name: 'Hashtag Gen', description: 'Smart hashtags for reach and niche dominance.', icon: '#️⃣', category: ToolCategory.CONTENT },

  // Developer
  { id: 'code-writer', name: 'Code Writer', description: 'Task-based professional code generation and fixing.', icon: '💻', category: ToolCategory.DEVELOPER }
];
