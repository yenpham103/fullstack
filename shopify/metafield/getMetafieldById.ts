import { HttpException } from '@nestjs/common';
import { GRAPHQL_ERROR_MESSAGE } from '@common/constants/message.const';

import axios, { AxiosRequestConfig } from 'axios';

import { config } from 'dotenv';

config();

const { API_VERSION } = process.env;

async function fetchData(url: string, config?: AxiosRequestConfig): Promise<any> {
  try {
    const response = await axios({
      url,
      method: config?.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      data: config?.data,
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw {
        status: error.response.status,
        statusText: error.response.statusText,
        message: error.response.data || error.response.statusText,
      };
    } else {
      throw {
        message: error.message,
      };
    }
  }
}

export const getMetafieldById = async ({
    domain,
    accessToken,
    id,
}) => {
    try {
        const getMetafieldQuery = `query metafield($id: ID!) {
            metafield(id: $id) {
              id
              key
              value
              type
              description
              legacyResourceId
              namespace
              reference
            }
          }
          `;

        const query = JSON.stringify({
          query: getMetafieldQuery,
          variables: {id}
        });
        
        const response = await fetchData(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
            method: `POST`,
            headers: {
                'Content-Type': `application/json`,
                "X-Shopify-Access-Token": accessToken,
            },
            data: query
        });
        
        return (response?.data) || null;
    } catch (error) {
        const status = error?.cause?.status || 502;
        throw new HttpException(GRAPHQL_ERROR_MESSAGE, status, {
            cause: error?.cause,
        });
    }
};
