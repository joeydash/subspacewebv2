'use client';

import React, { useState } from 'react';
import { FileImage, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';

interface UploadTermsComponentProps {
  groupId: string;
  onMakePublic?: () => void;
}

const UploadTermsComponent: React.FC<UploadTermsComponentProps> = ({
  groupId,
  onMakePublic,
}) => {
  const { user } = useAuthStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    if (!user?.id || !user?.auth_token || !groupId) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // Convert file to base64
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert file to base64'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // Upload using the provided mutation
      const response = await fetch('https://db.subspace.money/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.auth_token}`
        },
        body: JSON.stringify({
          query: `
            mutation update_subscription_expiry(
              $expiry_image: String!
              $room_id: uuid!
              $user_id: uuid!
            ) {
              __typename
              w_update_subscription_expiry(
                request: { expiry_image: $expiry_image, room_id: $room_id, user_id: $user_id }
              ) {
                __typename
                expiry_image
              }
            }
          `,
          variables: {
            expiry_image: base64Image,
            room_id: groupId,
            user_id: user.id
          }
        })
      });

      const data = await response.json();
      
      if (data.errors) {
        setUploadError(data.errors[0]?.message || 'Failed to upload image');
        return;
      }

      const result = data.data?.w_update_subscription_expiry;
      if (result?.expiry_image) {
        setUploadedImageUrl(result.expiry_image);
        setUploadError(null);
      } else {
        setUploadError('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleMakePublic = () => {
    if (termsAccepted && uploadedImageUrl) {
      onMakePublic?.();
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          dragOver
            ? 'border-indigo-400 bg-indigo-500/10'
            : uploadedImageUrl
            ? 'border-green-400 bg-green-500/10'
            : 'border-gray-600 bg-dark-400/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center gap-4">
          <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
            uploadedImageUrl ? 'bg-green-500/20' : 'bg-gray-500/20'
          }`}>
            {uploadedImageUrl ? (
              <CheckCircle className="h-8 w-8 text-green-400" />
            ) : (
              <FileImage className="h-8 w-8 text-gray-400" />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-white mb-2">
              {selectedFile ? selectedFile.name : 'Upload the Image'}
            </h3>
            {!uploadedImageUrl && (
              <p className="text-gray-400 text-sm">
                Drag and drop an image here, or click to select
              </p>
            )}
          </div>

          {!uploadedImageUrl && !isUploading && (
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg transition-colors">
                Choose File
              </div>
            </label>
          )}

          {isUploading && (
            <div className="flex items-center gap-2 text-indigo-400">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-400"></div>
              <span>Uploading...</span>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{uploadError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Terms and Conditions</h2>
        
        <div className="space-y-4 text-gray-300">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 shrink-0"></div>
            <p className="text-sm leading-relaxed">
              I have read, understand, and agree to comply with Subspace's terms and 
              conditions, Subspace's privacy policy, and Subspace's return and refund policy.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 shrink-0"></div>
            <p className="text-sm leading-relaxed">
              I confirm that, and I understand that Subspace is not associated or affiliated with 
              Netflix.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 shrink-0"></div>
            <p className="text-sm leading-relaxed">
              I have read, understand, and agree to comply with Netflix's sharing terms and 
              conditions.
            </p>
          </div>
        </div>

        {/* Terms Acceptance Checkbox */}
        <div className="flex items-start gap-3 p-4 bg-dark-400/50 rounded-lg">
          <button
            onClick={() => setTermsAccepted(!termsAccepted)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              termsAccepted
                ? 'bg-indigo-500 border-indigo-500'
                : 'border-gray-500 hover:border-gray-400'
            }`}
          >
            {termsAccepted && (
              <CheckCircle className="h-3 w-3 text-white" />
            )}
          </button>
          <p className="text-sm text-gray-400 leading-relaxed">
            By clicking on Make it Public, you agree to the T&C above.
          </p>
        </div>
      </div>

      {/* Make it Public Button */}
      <button
        onClick={handleMakePublic}
        disabled={!termsAccepted || !uploadedImageUrl || isUploading}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 ${
          termsAccepted && uploadedImageUrl && !isUploading
            ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        Make it Public
      </button>
    </div>
  );
};

export default UploadTermsComponent;