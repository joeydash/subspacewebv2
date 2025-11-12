import axios from "axios";

export const apiClient = axios.create({
  baseURL: 'https://db.subspace.money/v1/graphql',
  headers: {
    "Content-Type": "application/json",
  },
});
