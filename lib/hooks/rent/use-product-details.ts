import { useState, useEffect } from 'react';

interface SubscriptionProduct {
  id: string;
  service_id: string;
  product_name: string;
  product_description: string;
  product_photos: string[];
}

interface UseProductDetailsParams {
  productId: string | undefined;
  authToken: string | undefined;
}

export const useProductDetails = ({ productId, authToken }: UseProductDetailsParams) => {
  const [productDetails, setProductDetails] = useState<SubscriptionProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId || !authToken) return;

    const fetchProductDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('https://db.subspace.money/v1/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `
              query GetProductById($id: uuid!) {
                whatsub_subscription_product_by_pk(id: $id) {
                  id
                  service_id
                  product_name
                  product_description
                  product_photos
                }
              }
            `,
            variables: {
              id: productId
            }
          })
        });

        const data = await response.json();

        if (data.errors) {
          setError('Failed to load product details');
          return;
        }

        const product = data.data?.whatsub_subscription_product_by_pk;
        if (product) {
          setProductDetails({
            id: product.id,
            service_id: product.service_id,
            product_name: product.product_name,
            product_description: product.product_description || '',
            product_photos: product.product_photos || []
          });
        } else {
          setError('Product not found');
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
        setError('Failed to load product details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId, authToken]);

  return { productDetails, isLoading, error };
};
