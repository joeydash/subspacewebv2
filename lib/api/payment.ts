import { apiClient } from "@/config/axios-client";

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  ifsc: string;
  isVerified: boolean;
}

export const fetchBankDetails = async ({ userId, authToken }: { userId: string; authToken: string }) => {
  const query = `
    query getBankDetails($user_id: uuid!) {
      whatsub_bank_account_details(where: { user_id: { _eq: $user_id } }) {
        id
        account_name
        bank_account_number
        bank_name
        ifsc
        upi_id
        user_id
      }
    }
  `;

  const variables = { user_id: userId };

  const { data } = await apiClient.post(
    "",
    { query, variables },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  const details = data?.data?.whatsub_bank_account_details || [];

  if (details.length > 0) {
    const bankDetail = details[0];
    return {
      accountName: bankDetail.account_name || '',
      accountNumber: bankDetail.bank_account_number || '',
      ifsc: bankDetail.ifsc || '',
      isVerified: !!bankDetail.account_name,
    };
  }

  return {
    accountName: '',
    accountNumber: '',
    ifsc: '',
    isVerified: false,
  };
};

export interface VerifyBankDetailsParams {
  userId: string;
  authToken: string;
  accountNumber: string;
  ifsc: string;
}

export interface VerifyBankDetailsResponse {
  accountName: string;
  success: boolean;
  message?: string;
}

export const verifyAndSaveBankDetails = async ({
  userId,
  authToken,
  accountNumber,
  ifsc,
}: VerifyBankDetailsParams): Promise<VerifyBankDetailsResponse> => {
  // Step 1: Verify bank details
  const verifyQuery = `
    query MyQuery(
      $account: String = ""
      $ifsc: String = ""
      $user_id: uuid = ""
    ) {
      whatsubKycBankAccountVerification(
        request: { account_number: $account, ifsc: $ifsc, user_id: $user_id }
      ) {
        bank_account_details
      }
    }
  `;

  const { data: verifyData } = await apiClient.post(
    "",
    {
      query: verifyQuery,
      variables: {
        account: accountNumber,
        ifsc: ifsc,
        user_id: userId,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  if (verifyData?.errors) {
    throw new Error(verifyData.errors[0]?.message || 'Bank details verification failed');
  }

  const verifiedBankDetails = verifyData?.data?.whatsubKycBankAccountVerification?.bank_account_details;

  if (!verifiedBankDetails) {
    throw new Error('Bank details verification failed');
  }

  const accountName = verifiedBankDetails.nameAtBank;

  // Step 2: Save verified bank details to database
  const saveMutation = `
    mutation UpsertBankDetails(
      $user_id: uuid!,
      $bank_account_number: String!,
      $ifsc: String!,
      $account_name: String!
    ) {
      insert_whatsub_bank_account_details(
        objects: {
          user_id: $user_id
          bank_account_number: $bank_account_number
          ifsc: $ifsc
          account_name: $account_name
        }
        on_conflict: {
          constraint: whatsub_bank_account_details_user_id_key
          update_columns: [bank_account_number, ifsc, account_name]
        }
      ) {
        affected_rows
        returning {
          id
          user_id
          account_name
          bank_account_number
          ifsc
        }
      }
    }
  `;

  const { data: saveData } = await apiClient.post(
    "",
    {
      query: saveMutation,
      variables: {
        user_id: userId,
        bank_account_number: accountNumber,
        ifsc: ifsc,
        account_name: accountName,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  if (saveData?.errors) {
    throw new Error('Bank details verified but failed to save. Please try again.');
  }

  if (saveData?.data?.insert_whatsub_bank_account_details?.affected_rows > 0) {
    return {
      accountName,
      success: true,
      message: 'Bank details verified and saved successfully',
    };
  }

  throw new Error('Bank details verified but failed to save. Please try again.');
};
