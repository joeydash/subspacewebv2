import React, { useState, useEffect, useCallback } from 'react';
import { Bell, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface NotificationSettings {
  message: boolean;
  subscription_expiry: boolean;
  coupon_expiry: boolean;
  promotional: boolean;
}

const NotificationSettingsComponent: React.FC = () => {
  const { user } = useAuthStore();
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    message: false,
    subscription_expiry: false,
    coupon_expiry: false,
    promotional: false
  });
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchNotificationSettings = useCallback(async () => {
    if (!user?.id || !user?.auth_token) return;

    setIsLoadingNotifications(true);
    try {
      const response = await fetch('https://db.subspace.money/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.auth_token}`
        },
        body: JSON.stringify({
          query: `
            query Query($user_id: uuid) {
              __typename
              whatsub_store_user_notification_settings(where: {user_id: {_eq: $user_id}}) {
                __typename
                message
                subscription_expiry
                coupon_expiry
                promotional
              }
            }
          `,
          variables: {
            user_id: user.id
          }
        })
      });

      const data = await response.json();

      if (data.data?.whatsub_store_user_notification_settings?.[0]) {
        const settings = data.data.whatsub_store_user_notification_settings[0];
        setNotificationSettings({
          message: settings.message || false,
          subscription_expiry: settings.subscription_expiry || false,
          coupon_expiry: settings.coupon_expiry || false,
          promotional: settings.promotional || false
        });
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [user?.id, user?.auth_token]);

  useEffect(() => {
    if (user?.id && user?.auth_token) {
      fetchNotificationSettings();
    }
  }, [user?.id, user?.auth_token, fetchNotificationSettings]);

  const handleNotificationSettingsToggle = async (key: keyof NotificationSettings) => {
    const newValue = !notificationSettings[key];

    setNotificationSettings(prev => ({
      ...prev,
      [key]: newValue
    }));

    updateNotificationSettings(key, newValue);
  };

  const updateNotificationSettings = async (key: keyof NotificationSettings, value: boolean) => {
    if (!user?.id || !user?.auth_token) return;

    try {
      const response = await fetch('https://db.subspace.money/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.auth_token}`
        },
        body: JSON.stringify({
          query: `
            mutation updateNotificationSettings(
              $user_id: uuid!,
              $message: Boolean,
              $subscription_expiry: Boolean,
              $coupon_expiry: Boolean,
              $promotional: Boolean
            ) {
              __typename
              insert_whatsub_store_user_notification_settings_one(
                object: {
                  user_id: $user_id,
                  message: $message,
                  subscription_expiry: $subscription_expiry,
                  coupon_expiry: $coupon_expiry,
                  promotional: $promotional
                },
                on_conflict: {
                  constraint: whatsub_store_user_notification_settings_pkey,
                  update_columns: [message, subscription_expiry, coupon_expiry, promotional]
                }
              ) {
                __typename
                user_id
              }
            }
          `,
          variables: {
            user_id: user.id,
            ...notificationSettings,
            [key]: value
          }
        })
      });

      const data = await response.json();

      if (data.errors) {
        console.error('Error updating notification settings:', data.errors);
        setNotificationSettings(prev => ({
          ...prev,
          [key]: !value
        }));
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      setNotificationSettings(prev => ({
        ...prev,
        [key]: !value
      }));
    }
  };

  return (
    <>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
      >
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-gray-400 group-hover:text-white" />
          <span className="font-medium">Notification Settings</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-white" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-white" />
        )}
      </button>
      {isExpanded && (
        isLoadingNotifications ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading settings...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">Message Notifications</h4>
                <p className="text-sm text-gray-400">Receive notifications for new messages</p>
              </div>
              <button
                onClick={() => handleNotificationSettingsToggle('message')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${notificationSettings.message ? 'bg-indigo-600' : 'bg-gray-600'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.message ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">Subscription Expiry</h4>
                <p className="text-sm text-gray-400">Get notified before subscriptions expire</p>
              </div>
              <button
                onClick={() => handleNotificationSettingsToggle('subscription_expiry')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${notificationSettings.subscription_expiry ? 'bg-indigo-600' : 'bg-gray-600'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.subscription_expiry ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">Coupon Expiry</h4>
                <p className="text-sm text-gray-400">Get notified before coupons expire</p>
              </div>
              <button
                onClick={() => handleNotificationSettingsToggle('coupon_expiry')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${notificationSettings.coupon_expiry ? 'bg-indigo-600' : 'bg-gray-600'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.coupon_expiry ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">Promotional</h4>
                <p className="text-sm text-gray-400">Receive promotional offers and updates</p>
              </div>
              <button
                onClick={() => handleNotificationSettingsToggle('promotional')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-dark-600 ${notificationSettings.promotional ? 'bg-indigo-600' : 'bg-gray-600'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSettings.promotional ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>
        )
      )}
    </>
  );
};

export default NotificationSettingsComponent;
