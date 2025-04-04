# Metafield, Metaobjects

# Metafields

# Metaobject

metaobject là 1 tính năng mở rộng hơn của metafield, cho phép các cấu trúc dữ liệu phức tạp đa dạng hơn và **hoàn toàn độc lập** với Shopify resource (product, order,…)

---

<aside>
💡

**Access scopes**

```jsx
write_metaobject_definitions,read_metaobject_definitions,write_metaobjects,read_metaobjects,unauthenticated_read_metaobjects
```

- **write_metaobject_definitions**
- **read_metaobject_definitions**
- **write_metaobjects**
- **read_metaobjects**
- **unauthenticated_read_metaobjects**

---

- ***Tại sao cần dùng metaobject để lưu option set thay vì dùng metafield?***
    1. Khi số lượng option set lớn, được thêm trực tiếp vào DOM của website thông qua liquid
        
        ```jsx
        // bss-po-script.liquid
        
        <script id="bss-po-config-data">
            var data = {{ app.metafields.OPTION_APP_DATA.BSS_PO }}
        ```
        
        → số lượng option set lớn → dung lượng DOM tăng → gg search ko parse được dom do nặng hơn mức cho phép → ảnh hưởng đến SEO
        
        đếm số lượng kí tự ở đây
        
        https://www.charactercountonline.com/
        
        ⇒ cần chuyển sang truy cập data thông qua api (Storefront API của shopify)
        
    2. Metafield của app không được StorefontAPI hỗ trợ
    3. Metaobject có thể được truy cập thông qua Storefront API

### Postman - GraphQL Metaobject API doc

import để chạy, thay các params và access token

https://documenter.getpostman.com/view/34905916/2sAXxLCujT

</aside>

<aside>
💡

**Các bước sử dụng metaobject từ storefront:**

1. *Tạo Storefront access token*: token này dùng để đọc metaobject trên storefront
2. *Tạo Metaobject để lưu option sets data*
3. *Đọc metaobject trên storefront*
</aside>

## Storefront access token

<aside>
💡

1. storefront access token sẽ **ko bị rate limit (giới hạn số lượng gọi request)**
    
    https://shopify.dev/docs/api/storefront#rate_limits
    
2. một app có thể có 100 active token trêm mỗi shop, với 1 token ta có
    - `title`: tên của nó (title được trùng nhau, nên dùng tên khác nhau cho mỗi token)
    - `accessScopes`: xác định xem mình có thể dùng token đó truy cập vào những tài ng nào
    
    chưa có graphql để update access scopes của 1 token 
    
    → 1 token thiếu scope thì cần **tạo token mới** (khi nào số lượng token nhiều thêm cần handle xóa token cũ)
    
</aside>

### Generate

1. **generate storefront token có access scope đọc metaobject `unauthenticated_read_metaobjects`**
    
    ```jsx
    // shop.service.js
    const createStorefrontToken = require('@root/src/utils/graphql/shops/createStorefrontToken.js');
    const getStorefrontAccessToken = require('@root/src/utils/graphql/shops/getStorefrontAccessToken.js');
    
    async createStorefrontAccessToken(domain, accessToken) {
        try {
            const storefrontAccessTokenList = await getStorefrontAccessToken(domain, accessToken);
            let storefrontAccessToken =
                storefrontAccessTokenList?.shop?.storefrontAccessTokens?.nodes.find(
                    (item) =>
                        item.title === STOREFRONT_TOKEN_TITLE &&
                        item.accessScopes.find((scope) => scope.handle === "unauthenticated_read_metaobjects")
                );
    
            if (!storefrontAccessToken) {
                return await createStorefrontToken(
                    domain,
                    accessToken,
                    STOREFRONT_TOKEN_TITLE
                );
            }
            return storefrontAccessToken?.accessToken;
            
        } catch (error) {
            logger.error(new logger.CustomError("Create storefront access token", error), { domain, errorDetail: String(error) });
        }
        return null;
    },
    ```
    
    - Graphql: getStorefrontAccessToken
        
        ```jsx
        const getStorefrontAccessToken = async (domain, accessToken) => {
            const query = `
            query {
                shop {
                  storefrontAccessTokens(first:100) {
                    nodes {
                      id
                      accessToken
                      accessScopes {description handle}
                      createdAt
                      title
                    }
                  }
                }
            }`;
        
            const response = await fetch(`https://${domain}/admin/api/${process.env.API_VERSION}/graphql.json`, {
                method: `POST`,
                headers: {
                    'Content-Type': `application/json`,
                    "X-Shopify-Access-Token": accessToken,
                },
                body: JSON.stringify({
                    query: query,
                    variables: {}
                })
            });
            const result = await response.json();
            return result.data;
        }
        
        module.exports = getStorefrontAccessToken;
        ```
        
    - Graphql: createStorefrontToken
        
        ```jsx
        const axios = require("axios");
        const { API_VERSION } = process.env;
        const { STOREFRONT_TOKEN_TITLE } = require("@root/src/apis/services/utils/constant");
        
        const createStorefrontToken = async (domain, token, accessTokenTitle = STOREFRONT_TOKEN_TITLE) => {
            try {
                const createTokenQuery = `mutation StorefrontAccessTokenCreate($input: StorefrontAccessTokenInput!) {
                    storefrontAccessTokenCreate(input: $input) {
                        userErrors {
                            field
                            message
                        }
                        shop {
                            id
                        }
                        storefrontAccessToken {
                            accessScopes {
                                handle
                            }
                            accessToken
                            title
                        }
                    }
                }`;
        
                const response = await axios({
                    method: "post",
                    url: `https://${domain}/admin/api/${API_VERSION}/graphql.json`,
                    headers: {
                        "Content-Type": "application/json",
                        "X-Shopify-Access-Token": token,
                    },
                    data: {
                        query: createTokenQuery,
                        variables: {
                            input: {
                                title: accessTokenTitle,
                            }
                        },
                    },
                });
                if (response?.data?.data?.storefrontAccessTokenCreate?.storefrontAccessToken?.accessToken) {
                    return response.data.data.storefrontAccessTokenCreate.storefrontAccessToken.accessToken;
                }
        
            } catch (e) {
                throw e;
            }
        };
        module.exports = createStorefrontToken;
        
        ```
        
2. **gọi create khi create shop, update shop hoặc khi nào cần gọi đến token này, lưu vào db**

> **References**
> 
> 
> ---
> 
> https://shopify.dev/docs/api/admin-graphql/2024-10/mutations/storefrontAccessTokenCreate
> 

### Lưu storefront access token vào metafield

lưu vào **metafield** 3 trường sau để js của app ngoài storefront có thể [gọi request lấy metaobject](https://www.notion.so/Metafield-Metaobjects-12ed73f2424f804dbab0c4d3a03f4880?pvs=21)

```jsx
storefrontAccessToken: shopData.storefront_token,
apiVersion: process.env.API_VERSION,
shop: shopData.domain,
```

## Metaobject

<aside>
💡

- Metaobject có thể share được giữa các app nếu muốn
    
    https://shopify.dev/docs/apps/build/custom-data/metaobjects/use-access-controls-metaobjects
    
- Limitation
    
    https://shopify.dev/docs/apps/build/custom-data/metaobjects/metaobject-limits
    
</aside>

<aside>
💡

**Các bước để tạo metaobject:**

1. Tạo Metaobject definition (hiểu đơn giản như định nghĩa class)
2. Tạo metaobject từ definition đó
</aside>

### Metaobject definition

<aside>
💡

1 definition gồm có 

- `type` : nên đặt theo dạng `$app:<app_name_data_type>`
- `access` : trên storefront cần để `PUBLIC_READ` để đọc được metaobject
- `fieldDefinitions` : 1 mảng field, số lượng field do mình đặt, mỗi field sẽ gồm các props (data sẽ được lưu vào trường `value` của field)
- **Ex:**
    
    ```jsx
    type: "$app:<app_name_data_type>",
    access: {
        admin: "PRIVATE",
        storefront: "PUBLIC_READ",
    },
    fieldDefinitions: [
    	{
          key: `${keyPrefix}_0`,
          type: 'json',
          name: "data name"
      },
      {
          key: `${keyPrefix}_1`,
          type: 'json',
          name: "data name"
      }
    ]
    ```
    
</aside>

<aside>
💡

**Để tạo metaobject definition:**

1. Kiểm tra xem definition type `$app:<app_name_data_type>` đã được tạo chưa qua graphql [**metaobjectDefinitionByType**](https://shopify.dev/docs/api/admin-graphql/2024-10/queries/metaobjectDefinitionByType)
2. Tính toán dung lượng dữ liệu để tính xem cần định nghĩa bao nhiêu field để lưu (limit `1000000`)
3. Với th đã tạo definition:
    
    sd graphql  [**metaobjectDefinitionUpdate](https://shopify.dev/docs/api/admin-graphql/2024-10/mutations/metaobjectDefinitionUpdate)**  để thêm, xóa field
    
    - thiếu field: update thêm số lượng field
    - thừa field: **phải xóa số field thừa đi** để tránh lên storefront bị trùng lặp data
</aside>

> **References**
> 
> 
> ---
> 
> https://shopify.dev/docs/api/admin-graphql/2024-10/queries/metaobjectDefinitionByType
> 
> https://shopify.dev/docs/api/admin-graphql/2024-10/mutations/metaobjectdefinitioncreate
> 
> https://shopify.dev/docs/api/admin-graphql/2024-10/mutations/metaobjectDefinitionUpdate
> 
> https://shopify.dev/docs/api/admin-graphql/2024-10/mutations/metaobjectDefinitionDelete
> 

### Metaobject (entry)

<aside>
💡

1 metaobject gồm có

- `type` : chính là type của metaobject definition
- `handle` : mỗi metaobject có 1 unique handle
- `fields`: field để lưu dữ liệu, ***field key và field type phải giống với đã được định nghĩa ở [Metaobject definition](https://www.notion.so/Metaobject-definition-12fd73f2424f808ca3c6d4c5323abbdf?pvs=21)***
- graphql variable
    
    ```jsx
    variables: {
        handle: {
            type: type,
            handle: handle,
        },
        metaobject: {
            fields: fields,
        }
    },
    ```
    
</aside>

gọi graphql để upsert metaobject

> **References**
> 
> 
> ---
> 
> https://shopify.dev/docs/api/admin-graphql/2024-10/mutations/metaobjectUpsert
> 

### Lưu config vào metaobject

2 trường hợp

- app chưa update scope → đang dùng metafield
- app đã update scope/cài mới → dùng metaobject

---

- 1. Tạo biến và check xem store có dùng metaobject không trước khi upload config
    
    ```jsx
    let isUseMetaobject 
    = await metaobjectHelper.checkStorefrontTokenCanReadMetaobject(domain, 
    accessToken, constants.STOREFRONT_TOKEN_TITLE);
    ```
    
    ```jsx
    async checkStorefrontTokenCanReadMetaobject(domain, accessToken, tokenTitle) {
            try {
                const storefrontAccessTokenList = await getStorefrontAccessToken(domain, accessToken);
                let storefrontAccessToken = findStorefrontTokenHasScopes({
                    neededScopes: ["unauthenticated_read_metaobjects"],
                    tokenTitle: tokenTitle,
                    storefrontTokens: storefrontAccessTokenList?.shop?.storefrontAccessTokens?.nodes,
                })
                return !!storefrontAccessToken;
            } catch (error) {
                logger.error(new CustomError("Error when check is use metaobject", error), { domain });
                return false;
            }
    
        }
    ```
    
- 2. Tùy vào true/false để lưu
    
    ```jsx
    let poMetafieldData = [
        {
            key: 'BSS_PO',
            type: 'json',
            value: JSON.stringify({
                storeId: shopData.id,
                currentPlan: shopData.plan_code != null ? shopData.plan_code : null,
                storeIdCustomOld: process.env.STORE_ID_CUSTOM_OLD,
    						........ bla bla
                storefrontAccessToken: shopData.storefront_token,
                isUseMetaobject: isUseMetaobject,
                apiVersion: process.env.API_VERSION,
                shop: shopData.domain,
            })
        },
        {
            key: 'BSS_PO_SUPPORT',
            type: 'json',
            value: JSON.stringify(fixSupportContent)
        },
    ]
    
    if(!isUseMetaobject) {
        const optionSetMetafields = helper.getKeyMetafieldOptionSet(arrayOptionSets)
        poMetafieldData.push(...optionSetMetafields);
    }
    
    await helper.setMetaFields(shopData.domain, shopData.token, poMetafieldData);
    
    if(isUseMetaobject) {
        await metaobjectHelper.updateMetaobjectOptionSets(shopData.domain, shopData.token, optionSetChunks);
    }
    ```
    

## Lấy ra metaobject từ storefront

<aside>
💡

**Xử lý để đảm bảo khi chưa update scope cũng vẫn hoạt động**

- function check `isUseMetaobject`
    
    biến `isUseMetaobject` lưu vào metafield để file liquid gọi
    
    check bằng cách kiểm tra storefront token này đã có scope cần để đọc metaobject hay chưa
    
    ```jsx
    let isUseMetaobject = await metaobjectHelper.checkStorefrontTokenCanReadMetaobject(domain, accessToken, constants.STOREFRONT_TOKEN_TITLE);
    
    async checkStorefrontTokenCanReadMetaobject(domain, accessToken, tokenTitle) {
      try {
          const storefrontAccessTokenList = await getStorefrontAccessToken(domain, accessToken);
          let storefrontAccessToken = findStorefrontTokenHasScopes({
              neededScopes: ["unauthenticated_read_metaobjects"],
              tokenTitle: tokenTitle,
              storefrontTokens: storefrontAccessTokenList?.shop?.storefrontAccessTokens?.nodes,
          })
          return !!storefrontAccessToken;
      } catch (error) {
          logger.error(new CustomError("Error when check is use metaobject", error), { domain });
          return false;
      }
    
    }
    
    function findStorefrontTokenHasScopes({ neededScopes = [], tokenTitle, storefrontTokens }) {
        if (!storefrontTokens.length) return null;
        return storefrontTokens.find(
            (item) => {
                if (item.title === tokenTitle) {
                    let hasAllNeededScopes = true;
                    neededScopes.forEach(needScope => {
                        if (!item.accessScopes.find((scope) => scope.handle == needScope)) hasAllNeededScopes = false;
                    })
                    if (hasAllNeededScopes) return item;
                }
                return null;
            }
        )
    }
        
    const getStorefrontAccessToken = async (domain, accessToken) => {
        const query = `
        query {
            shop {
              storefrontAccessTokens(first:100) {
                nodes {
                  id
                  accessToken
                  accessScopes {description handle}
                  createdAt
                  title
                }
              }
            }
        }`;
    
        const response = await fetch(`https://${domain}/admin/api/${process.env.API_VERSION}/graphql.json`, {
            method: `POST`,
            headers: {
                'Content-Type': `application/json`,
                "X-Shopify-Access-Token": accessToken,
            },
            body: JSON.stringify({
                query: query,
                variables: {}
            })
        });
        const result = await response.json();
        return result.data;
    }
    ```
    
- bss-po-script.liquid
    
    ```jsx
    {% comment %} Check if use metaObject {% endcomment %}
    {% assign isUseMetaobject = false %}
    {% if app.metafields.OPTION_APP_DATA.BSS_PO.value.isUseMetaobject == true %}
        {% assign isUseMetaobject = true %}
    {% endif %}
    
    {% if isUseMetaobject == false %}
        {% comment %} Old customer use metafield to store config {% endcomment %}
        {% for i in (0..app.metafields.OPTION_APP_DATA.BSS_PO.value.optionSetTotalKey) %}
            {% assign id = 'optionSets_' | append: i %}
            {% assign data = app.metafields.OPTION_APP_DATA[id] %}
            optionSets = [...optionSets, ...{{ data }}]
        {% endfor %}
        BSS_PO.optionSets = optionSets
        customFlatpickrCss();
        featureForProPlan();
    {% else %}
        BSS_PO.metaobject = {
            storefrontAccessToken: data?.storefrontAccessToken,
            domain: data?.shop,
            apiVersion: data?.apiVersion,
        }
        
    {% endif %}
    ```
    

***Lưu ý:***

- không gọi request graphql ở file `bss-po-script.liquid` → cần chuyển sang gọi ở `bss-po-js.js`
    
    do file liquid và file js tách biệt nhau, file js cần option set data để chạy
    
    mà graphql lấy option thông qua metaobject là ko đồng bộ, cần await xong data mới chạy js
    
    → nếu nó chưa chạy xong mà js của app đã gọi thì data vẫn còn rỗng gây ra lỗi
    
</aside>

### Example

Trong file `extensions/assets/bss-po-js.js` lấy ra metaobject đã được lưu

Query: điền handle và type tương ứng vào `<metaobject_of_data>` và `<app_name>`

```graphql
{
    metaobject(handle: {
        handle: "<metaobject_of_data>",
        type: "$app:<app_name>",
    }) {
        # Metaobject fields
        fields {
            key
            value
        }
    }
}
```

Request: dùng `domain, apiVersion, storefrontAccessToken` đã lưu trong metafield để gọi

```jsx
await fetch(`https://${domain}/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontAccessToken
    },
    body: JSON.stringify({
        query: query
    })
})
.then((res) => res.json())
.then((data) => {
    const metaobjectData = data.data.metaobject.fields;
    // your code
    for (const element of metaobjectData) {
		  optionSets = [...optionSets, ...JSON.parse(element.value)];
	  }
	  BSS_PO.optionSets = optionSets;
});
```

- Code PO
    
    ```jsx
    // bss-po-js.js
    
    // use metaobject to get option set
        if (BSS_PO?.metaobject?.storefrontAccessToken) {
            let optionSets = [];
            let query = `
                    {
                        metaobject(handle: {
                            handle: "bss_po_metaobject_option_sets",
                            type: "$app:bss_po_option_set",
                        }) {
                            # Metaobject fields
                            fields {
                                key
                                value
                            }
                        }
                    }`;
            await fetch(`https://${BSS_PO.metaobject.domain}/api/${BSS_PO.metaobject.apiVersion}/graphql.json`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Shopify-Storefront-Access-Token": BSS_PO.metaobject.storefrontAccessToken
                },
                body: JSON.stringify({
                    query: query
                })
            })
                .then((res) => res.json())
                .then((data)
    ```
    

## Delete metaobject definition khi gỡ app

tại webhook uninstall app, dùng [**metaobjectDefinitionDelete](https://shopify.dev/docs/api/admin-graphql/2024-10/mutations/metaobjectDefinitionDelete)** để xóa metaobject definition (metaobject được tạo từ định nghĩa này cx sẽ được shopify tự động xóa)