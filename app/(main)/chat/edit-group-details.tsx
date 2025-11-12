'use client';

import React, { useState } from 'react';
import { Camera, Save } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';

interface EditGroupDetailsProps {
  groupId: string;
  initialName: string;
  initialImage: string;
  onSave: (name: string, image: string) => void;
  onCancel: () => void;
}

const EditGroupDetails: React.FC<EditGroupDetailsProps> = ({
  groupId,
  initialName,
  initialImage,
  onSave,
  onCancel
}) => {
  const { user } = useAuthStore();
  const [editGroupName, setEditGroupName] = useState(initialName);
  const [editGroupImage, setEditGroupImage] = useState(initialImage);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [editDetailsError, setEditDetailsError] = useState<string | null>(null);

  const handleImageUpload = async (file: File) => {
    if (!user?.auth_token) return;
    
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

      // Update the edit image state
      setEditGroupImage(base64Image);
    } catch (error) {
      console.error('Error processing image:', error);
      setEditDetailsError('Failed to process image');
    }
  };

  const handleSaveDetails = async () => {
    if (!user?.auth_token || !groupId) return;
    
    setIsSavingDetails(true);
    setEditDetailsError(null);
    
    try {
      let nameUpdateSuccess = true;
      let imageUpdateSuccess = true;
      
      // Update group name if it has changed
      if (editGroupName.trim() !== initialName) {
        const nameResponse = await fetch('https://db.subspace.money/v1/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.auth_token}`
          },
          body: JSON.stringify({
            query: `
              mutation changeGroupName($room_id: uuid!, $name: String!) {
                __typename
                update_whatsub_rooms(
                  where: { id: { _eq: $room_id } }
                  _set: { name: $name }
                ) {
                  __typename
                  affected_rows
                }
              }
            `,
            variables: {
              room_id: groupId,
              name: editGroupName.trim()
            }
          })
        });

        const nameData = await nameResponse.json();
        
        if (nameData.errors || nameData.data?.update_whatsub_rooms?.affected_rows === 0) {
          nameUpdateSuccess = false;
          setEditDetailsError(nameData.errors?.[0]?.message || 'Failed to update group name');
        }
      }
      
      // Update group image if it has changed
      if (editGroupImage !== initialImage && nameUpdateSuccess) {
        const imageResponse = await fetch('https://db.subspace.money/v1/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.auth_token}`
          },
          body: JSON.stringify({
            query: `
              mutation changeGroupDp($user_id: uuid!, $image: String!, $room_id: uuid!) {
                __typename
                w_changeGroupDp(
                  request: { user_id: $user_id, room_id: $room_id, image: $image }
                ) {
                  __typename
                  dp
                }
              }
            `,
            variables: {
              user_id: user.id,
              room_id: groupId,
              image: editGroupImage
            }
          })
        });

        const imageData = await imageResponse.json();
        
        if (imageData.errors || !imageData.data?.w_changeGroupDp?.dp) {
          imageUpdateSuccess = false;
          setEditDetailsError(imageData.errors?.[0]?.message || 'Failed to update group image');
        } else {
          // Update the edit image with the returned DP URL
          setEditGroupImage(imageData.data.w_changeGroupDp.dp);
        }
      }
      
      // If both updates were successful, call onSave
      if (nameUpdateSuccess && imageUpdateSuccess) {
        onSave(editGroupName.trim(), editGroupImage);
      }
    } catch (error) {
      console.error('Error updating group details:', error);
      setEditDetailsError('Network error. Please try again.');
    } finally {
      setIsSavingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white">Edit Group Details</h3>

      {/* Profile Image Section */}
      <div className="text-center">
        <div className="text-lg font-medium text-white mb-4">Change Profile Image</div>
        <div className="relative inline-block">
          <div className="w-32 h-32 rounded-2xl overflow-hidden bg-dark-400 mx-auto mb-4">
            <img
              src={editGroupImage}
              alt="Group"
              className="w-full h-full object-cover"
            />
          </div>
          <label className="absolute bottom-2 right-2 w-10 h-10 bg-dark-600 hover:bg-dark-500 rounded-lg flex items-center justify-center cursor-pointer transition-colors border border-gray-600">
            <Camera className="h-5 w-5 text-white" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImageUpload(file);
                }
              }}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Group Name Section */}
      <div>
        <label className="block text-lg font-medium text-white mb-4">
          Enter Group Name
        </label>
        <input
          type="text"
          value={editGroupName}
          onChange={(e) => setEditGroupName(e.target.value)}
          placeholder="Enter group name"
          className="w-full bg-dark-400 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>

      {/* Error Display */}
      {editDetailsError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
          {editDetailsError}
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSaveDetails}
        disabled={isSavingDetails || !editGroupName.trim()}
        className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {isSavingDetails ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            Saving...
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            Save
          </>
        )}
      </button>
    </div>
  );
};

export default EditGroupDetails;