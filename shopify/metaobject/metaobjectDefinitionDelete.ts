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

export const metaobjectDefinitionDelete = async ({
    domain, 
    accessToken, 
    id, 
}) => {
    try {
        const query = `mutation DeleteMetaobjectDefinition($id: ID!) {
            metaobjectDefinitionDelete(id: $id) {
              deletedId
              userErrors {
                message
              }
            }
        }`;

        const body = JSON.stringify({
            query: query,
            variables: { id }
        });

        const response = await fetchData(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
            method: `POST`,
            headers: {
                'Content-Type': `application/json`,
                "X-Shopify-Access-Token": accessToken,
            },
            data: body
        });
        
        return (response?.data) || null;
    } catch (error) {
        const status = error?.cause?.status || 502;
        throw new HttpException(GRAPHQL_ERROR_MESSAGE, status, {
            cause: error?.cause,
        });
    }
};
