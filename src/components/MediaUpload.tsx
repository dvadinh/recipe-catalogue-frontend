import { useRef, memo } from 'react';
import {
  Box,
  Button,
  IconButton,
  CardMedia,
  Typography,
} from '@mui/material';
import { CloudUpload as UploadIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface MediaUploadProps {
  media: string | null; // presignedUrl or preview URL
  onFileSelect: (file: File) => void;
  onDelete: () => void;
  disabled?: boolean;
  label?: string;
}

function MediaUpload({ media, onFileSelect, onDelete, disabled, label }: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type - images only
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box sx={{ mt: 2 }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {media ? (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: '1920px',
            paddingTop: '56.25%', // 16:9 aspect ratio (1080/1920)
            backgroundColor: '#f5f5f7',
            borderRadius: 2,
            overflow: 'hidden',
            margin: '0 auto',
          }}
        >
          <CardMedia
            component="img"
            image={media}
            src={media}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
          <IconButton
            onClick={onDelete}
            disabled={disabled}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' },
              zIndex: 1,
            }}
            size="small"
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ) : (
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={handleClick}
          disabled={disabled}
          fullWidth
          sx={{ py: 2 }}
        >
          {label || 'Upload Image'}
        </Button>
      )}

      {media && (
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
          Click delete to remove, or upload a new file to replace
        </Typography>
      )}
    </Box>
  );
}

export default memo(MediaUpload);
