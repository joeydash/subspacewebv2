import { apiClient } from "@/config/axios-client";

export const fetchAddresses = async (auth_token: string) => {
  const query = `
    query GetMyAddresses {
      whatsub_addresses {
        id
        name
        full_address
        contact_number
        type
        latitude
        longitude
        fhb_name
        floor
        nearby_landmark
        created_at
        updated_at
      }
    }
  `;

  const { data } = await apiClient.post(
    "",
    { query },
    {
      headers: {
        Authorization: `Bearer ${auth_token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (data.errors) {
    throw new Error(data.errors.map((e: any) => e.message).join(", "));
  }

  return data.data?.whatsub_addresses || [];
};

export const deleteAddress = async ({ addressId, authToken }: { addressId: string, authToken: string }) => {
  const query = `
    mutation DeleteAddress($id: uuid!) {
      delete_whatsub_addresses_by_pk(id: $id) {
        id
      }
    }
  `;

  const { data } = await apiClient.post(
    "",
    { 
      query,
      variables: { id: addressId }
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (data.errors) {
    throw new Error(data.errors.map((e: any) => e.message).join(", "));
  }

  return data.data?.delete_whatsub_addresses_by_pk;
};
