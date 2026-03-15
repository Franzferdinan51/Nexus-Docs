# Folder Upload Fix - Test Guide

## What Was Fixed

### Problem:
- Folder uploads (webkitdirectory) were not processing files
- Only PDFs and media files were supported
- Text files (.md, .txt, .json, .csv) were ignored
- Images (.png, .jpg, .jpeg) were not handled
- Files never appeared in the document list after upload

### Solution:

#### 1. Updated `handleFileUpload` function (App.tsx line ~533)
- Added support for webkitRelativePath to handle folder uploads
- Added text file processing (.md, .txt, .json, .csv, .html, .xml, .log, .tsv)
- Added image file processing (.png, .jpg, .jpeg, .gif, .webp, .bmp)
- Added proper video formats (.mp4, .mov, .avi, .webm)
- Added proper audio formats (.mp3, .wav, .m4a, .ogg, .flac)
- Fixed duplicate queueIds.push bug for ZIP files
- Pre-extracts content from text files during upload
- Pre-extracts images as base64 during upload

#### 2. Updated `processDocumentAgent` function (App.tsx line ~195)
- Added type-specific processing logic:
  - **Text files**: Use pre-extracted content or read from blob
  - **Images**: Use pre-extracted base64 images
  - **PDFs**: Use existing processPdf service
  - **Video/Audio**: Convert to base64 for mediaItem
- Prevents calling processPdf on non-PDF files

#### 3. Updated `processVerificationAgent` function (App.tsx line ~430)
- Added same type-specific processing as processDocumentAgent
- Ensures verification works for all file types

#### 4. Updated file input accept attribute (App.tsx line ~767)
- Added all supported file extensions
- Maintains webkitdirectory and directory attributes for folder uploads

## Testing Instructions

### Test 1: Upload a Folder with Mixed Content
1. Open Nexus-Docs in browser
2. Click "INGEST" button in sidebar
3. Select the `test-upload-folder` directory
4. Verify all 4 files appear in document list:
   - test-document.md
   - config.json
   - data.csv
   - notes.txt

### Test 2: Upload Individual Files
1. Click "INGEST" button
2. Select individual files of different types:
   - A PDF file
   - An image (.png or .jpg)
   - A text file (.md or .txt)
   - A video or audio file
3. Verify each file appears in document list

### Test 3: Verify Content Extraction
1. Upload a text file (e.g., test-document.md)
2. Wait for processing to complete
3. Click on the document to view details
4. Verify the content field contains the actual text

### Test 4: Verify Image Upload
1. Upload an image file
2. Wait for processing
3. Check that images array contains the base64 data
4. Verify analysis runs on the image

### Test 5: Verify Folder Structure Preservation
1. Upload a folder with nested subdirectories
2. Check that file names include the relative path
3. Verify files are distinguishable by their full path

## Expected Behavior

### Text Files:
- Content is immediately available (pre-extracted)
- Processing is faster (no PDF parsing needed)
- Analysis runs on the text content

### Images:
- Stored as base64 in images array
- Sent to analysis engine for visual processing
- Can be displayed in document details

### PDFs:
- Processed as before with processPdf service
- Text extracted page by page
- Images rendered from each page
- OCR fallback for scanned PDFs

### Media Files:
- Converted to base64
- Sent as mediaItem to analysis engine
- Processed by models that support video/audio

## Files Modified

- `/Users/duckets/Desktop/Nexus-Docs/App.tsx`
  - handleFileUpload function (~line 533)
  - processDocumentAgent function (~line 195)
  - processVerificationAgent function (~line 430)
  - File input accept attribute (~line 767)

## Test Files Created

- `/Users/duckets/Desktop/Nexus-Docs/test-upload-folder/`
  - test-document.md (markdown test)
  - config.json (JSON test)
  - data.csv (CSV test)
  - notes.txt (plain text test)

## Verification Checklist

- [ ] Folder upload works (webkitdirectory)
- [ ] Text files (.md, .txt, .json, .csv) are processed
- [ ] Images (.png, .jpg, .jpeg) are processed
- [ ] PDFs continue to work as before
- [ ] Videos (.mp4, .mov) are processed
- [ ] Audio (.mp3, .wav) are processed
- [ ] Files appear in document list after upload
- [ ] Content is extracted and stored correctly
- [ ] Analysis runs successfully for all file types
- [ ] No errors in browser console

## Notes

- The fix maintains backward compatibility with existing PDF processing
- Text files are now much faster to process (no PDF parsing overhead)
- Images are pre-extracted during upload for efficiency
- Folder uploads preserve relative paths in file names
- All file types go through the same analysis pipeline
