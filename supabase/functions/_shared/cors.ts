// Only the Stripe checkout/portal functions import this, and both are called
// exclusively from the production web app — so we pin the origin rather than '*'.
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://duty.leftfieldapps.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
