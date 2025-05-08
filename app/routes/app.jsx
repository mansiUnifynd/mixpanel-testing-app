// import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
// import { boundary } from "@shopify/shopify-app-remix/server";
// import { AppProvider } from "@shopify/shopify-app-remix/react";
// import { NavMenu } from "@shopify/app-bridge-react";
// import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
// import { authenticate } from "../shopify.server";

// export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

// export const loader = async ({ request }) => {
//   await authenticate.admin(request);

//   return { apiKey: process.env.SHOPIFY_API_KEY || "" };
// };

// export default function App() {
//   const { apiKey } = useLoaderData();

//   return (
//     <AppProvider isEmbeddedApp apiKey={apiKey}>
//       <NavMenu>
//         <Link to="/app" rel="home">
//           Home
//         </Link>
//         <Link to="/app/additional">Additional page</Link>
//       </NavMenu>
//       <Outlet />
//     </AppProvider>
//   );
// }

// // Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
// export function ErrorBoundary() {
//   return boundary.error(useRouteError());
// }

// export const headers = (headersArgs) => {
//   return boundary.headers(headersArgs);
// };




import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const targetAccountID = "123"; // Replace with your real account ID string
  let shouldCreatePixel = true;

  try {
    // 1. Check existing web pixels
    const query = `
      query {
        webPixels(first: 10) {
          edges {
            node {
              id
              settings
            }
          }
        }
      }
    `;

    const response = await admin.graphql(query);
    const data = await response.json();

    const existingPixels = data.data.webPixels.edges || [];

    // 2. Look for your pixel by accountID
    for (const edge of existingPixels) {
      const settings = JSON.parse(edge.node.settings);
      if (settings.accountID === targetAccountID) {
        console.log("✅ Pixel already exists with ID:", edge.node.id);
        shouldCreatePixel = false;
        break;
      }
    }

    // 3. If not found, create the pixel
    if (shouldCreatePixel) {
      const mutation = `
        mutation {
          webPixelCreate(webPixel: { settings: "{\\"accountID\\":\\"${targetAccountID}\\"}" }) {
            userErrors {
              code
              field
              message
            }
            webPixel {
              settings
              id
            }
          }
        }
      `;

      const mutationResponse = await admin.graphql(mutation);
      const mutationResult = await mutationResponse.json();

      if (mutationResult.data.webPixelCreate.userErrors.length > 0) {
        console.error("❌ Pixel creation errors:", mutationResult.data.webPixelCreate.userErrors);
      } else {
        console.log("✅ Pixel created:", mutationResult.data.webPixelCreate.webPixel.id);
      }
    }
  } catch (error) {
    console.error("❌ Failed to query or create pixel:", error);
  }

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">Home</Link>
        <Link to="/app/additional">Additional page</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
