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

export const updateMetafieldsDefinition = async ({
    domain,
    accessToken,
    metafields,
}) => {
    try {
        const updateInputs = metafields
            .map((_, index) => `$definition${index}: MetafieldDefinitionUpdateInput!`)
            .toString();

        const query = metafields
            .map((_, index) => {
                return `
                index${index}:metafieldDefinitionUpdate(definition: $definition${index}) {
                    updatedDefinition {
                        id
                        name
                    }
                    userErrors {
                        field
                        message
                        code
                    }
                }`;
            })
            .toString();

        const metafieldDefinitionUpdateQuery = `
            mutation UpdateMetafieldDefinition(${updateInputs}) {
                ${query}
            }
        `;

        const graphqlQuery = JSON.stringify({
            query: metafieldDefinitionUpdateQuery,
            variables: metafields.reduce((a, v, i) => ({ ...a, ["definition" + i]: v }), {}),
        });
        const response = await fetchData(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": accessToken,
            },
            data: graphqlQuery,
        });
        return (response?.data) || null;
    } catch (error) {
        const status = error?.cause?.status || 502;
        throw new HttpException(GRAPHQL_ERROR_MESSAGE, status, {
            cause: error?.cause,
        });
    }
};
