# Web HTTP API compatibility audit

Generated against backend main `085dd92` using
`backend_delivery/docs/platform/system/api/http-contract.json` and
`public-edge-manifest.json`. Firebase Auth/Firestore traffic is not HTTP
backend traffic and is listed separately below.

Verdict meanings: **OK** means verb/path/transport and the fields consumed by
the client match the backend contract; **MISMATCH** means a client defect was
corrected; **NOT_PUBLIC** means the backend operation exists but is not a
Gateway public-edge route; **MISSING_IN_BACKEND** means no controller operation
exists. Query/body fields are included where the call supplies them.

| App file:line | Method and resolved path | Query/body fields and response read | Verdict / backend contract id |
|---|---|---|---|
| `src/modules/auth/services/authService.ts:125` | POST `/api/auth/register` | email, password, role; registration identity/token | OK — `auth-service:AuthController.register:POST:/api/auth/register` |
| `src/modules/auth/services/authService.ts:146` | POST `/api/users/registrations` | provisioningToken, fullName, phone; profile identity | OK — `user-service:UserController.register:POST:/api/users/registrations` |
| `src/modules/auth/services/authService.ts:170` | GET `/api/auth/registrations/{handle}` | path handle; lifecycle status | OK — `auth-service:RegistrationController.getStatus:GET:/api/auth/registrations/{handle}` |
| `src/modules/auth/services/authService.ts:186` | POST `/api/auth/email-verification/request` | email | OK — `auth-service:AuthController.requestEmailVerification:POST:/api/auth/email-verification/request` |
| `src/modules/auth/services/authService.ts:195` | POST `/api/auth/email-verification/confirm` | token | OK — `auth-service:AuthController.confirmEmailVerification:POST:/api/auth/email-verification/confirm` |
| `src/modules/auth/services/authService.ts:223` | GET `/api/users` | profile identity fields | OK — `user-service:UserController.getCurrentUser:GET:/api/users` |
| `src/modules/admin/services/firebaseChatService.ts:122` | POST `/api/auth/firebase/chat-token` | none; token, principalId, role | OK — `auth-service:FirebaseChatController.issueToken:POST:/api/auth/firebase/chat-token` |
| `src/services/api/adminService.ts:265` | GET `/api/analytics/dashboard/admin` | period, year; dashboard series | OK — `analytics-service:DashboardController.getAdminDashboard:GET:/api/analytics/dashboard/admin` |
| `src/services/api/adminService.ts:279` | GET `/api/orders/all` | page, size; paged orders | OK — `order-service:OrderController.getAllOrders:GET:/api/orders/all` |
| `src/services/api/adminService.ts:291` | GET `/api/orders/status/{status}` | page, size; paged orders | OK — `order-service:OrderController.getOrdersByStatus:GET:/api/orders/status/{status}` |
| `src/services/api/adminService.ts:307` | POST `/api/restaurants/orders/{orderId}/confirm` | restaurantId, estimatedPrepTime, notes; status | OK — `restaurant-service:RestaurantOrderController.confirmOrder:POST:/api/restaurants/orders/{orderId}/confirm` |
| `src/services/api/adminService.ts:322` | POST `/api/restaurants/orders/{orderId}/reject` | restaurantId, reason; status | OK — `restaurant-service:RestaurantOrderController.rejectOrder:POST:/api/restaurants/orders/{orderId}/reject` |
| `src/services/api/adminService.ts:336` | GET `/api/shippers` | page, size; paged shippers | OK — `shipper-service:ShipperController.getAll:GET:/api/shippers` |
| `src/services/api/adminService.ts:348` | GET `/api/shippers/online` | none; shipper list | OK — `shipper-service:ShipperController.getOnline:GET:/api/shippers/online` |
| `src/services/api/adminService.ts:362` | GET `/api/restaurants/admin/ratings` | rating rows | OK — `restaurant-service:RatingController.adminList:GET:/api/restaurants/admin/ratings` |
| `src/services/api/adminService.ts:374` | PUT `/api/restaurants/admin/ratings/{id}/status` | query status; rating row | OK — `restaurant-service:RatingController.updateStatus:PUT:/api/restaurants/admin/ratings/{id}/status` |
| `src/services/api/adminService.ts:387` | GET `/api/promotions/admin` | coupon rows | OK — `promotion-service:PromotionController.adminList:GET:/api/promotions/admin` |
| `src/services/api/adminService.ts:399` | POST `/api/promotions/platform` | coupon creation DTO; coupon | OK — `promotion-service:PromotionController.createPlatform:POST:/api/promotions/platform` |
| `src/services/api/adminService.ts:413` | DELETE `/api/promotions/{id}` | path id | OK — `promotion-service:PromotionController.delete:DELETE:/api/promotions/{id}` |
| `src/services/api/adminService.ts:422` | GET `/api/promotions/admin/pending-shop` | coupon rows | OK — `promotion-service:PromotionController.pendingShop:GET:/api/promotions/admin/pending-shop` |
| `src/services/api/adminService.ts:428-443` | POST `/api/promotions/admin/{id}/{approve,reject,pause,resume}` | optional reject reason; coupon | OK — corresponding `promotion-service:PromotionController.{approve,reject,pause,resume}` operations |
| `src/services/api/promotionService.ts:97-134` | GET/POST `/api/promotions/{capability,my-vouchers,collect/{code},shop}` | code; voucher/capability DTOs | OK — corresponding `promotion-service` operations |
| `src/services/api/flashSaleService.ts:76-99` | GET/POST/PUT `/api/flashsales/admin/{campaigns,campaigns/{id}/items,campaigns/{id}/status,items/{id}/approve}` | campaign/status DTOs; campaign/item DTOs | OK — corresponding `flashsale-service` operations |
| `src/services/api/livestreamService.ts:231-255` | GET/POST/DELETE livestream routes | livestream/product DTOs; parsed response fields | OK — corresponding `livestream-service` operations |
| `src/services/api/livestreamModerationService.ts:25` | GET `/api/livestreams/admin` | page, size; content/page totals | OK — `livestream-service:LivestreamAdminController.list:GET:/api/livestreams/admin` |
| `src/services/api/livestreamModerationService.ts:44` | POST `/api/livestreams/{id}/moderation` | action, reason, productId; receipt | OK — `livestream-service:LivestreamModerationController.moderate:POST:/api/livestreams/{id}/moderation` |
| `src/modules/restaurant/services/restaurantService.ts:98-155` | POST/PUT/GET restaurant routes | restaurant DTO/query keyword; restaurant/rating fields | OK — corresponding `restaurant-service` operations |
| `src/modules/restaurant/services/orderService.ts:207-295` | GET/POST/PUT order routes | page, size, restaurantId, checkout/order/reason DTOs; order/page fields | OK — corresponding `order-service` and `restaurant-service` operations |
| `src/modules/restaurant/services/menuService.ts:60-101` | POST/PUT/DELETE/GET menu routes | menu DTO, restaurantId; menu fields | OK — corresponding `restaurant-service:MenuItemController` operations |
| `src/services/api/addressService.ts:75-113` | GET/POST/PUT/DELETE/PATCH address routes | address DTO; address fields | OK — corresponding `user-service:AddressController` operations |
| `src/services/api/webSessionClient.ts:29-42` | POST/GET/POST/POST `/bff/session/{login,,refresh,logout}` | credentials and CSRF header; session view | NOT_PUBLIC — `web-bff-service:WebSessionController` operations are backend BFF routes, intentionally absent from Gateway public-edge manifest |

Unused endpoint constants `/api/promotions/admin/page`,
`/api/flashsales/admin/campaigns/page`, and
`/api/flashsales/admin/campaigns/{id}/items/page` have no controller operation
in the authoritative contract. They are not called by this app and therefore
are not included in the executable route registry.

## EXTERNAL (not backend HTTP)

- `src/config/firebase.ts` and `src/modules/admin/services/firebaseChatService.ts`: Firebase Auth custom-token sign-in and Firestore listeners/writes for support chat.
- `src/components/maps/LocationPicker.tsx:233`: Mapbox geocoding `fetch`, an external map provider.
