---
description: Story map feature → create layer tasks → sync to Jira
---

# Feature Breakdown by Layers

Create feature tasks using agile layer breakdown guides and sync to Jira.

## Usage

```bash
/wb-feature-breakdown user-profile --type backend --sync jira
```

## Parameters

- `--type`: backend or frontend (determines layer guides)
- `--sync`: jira or clickup
- `--research`: Use research mode

## What It Does

1. Prompts for user stories
2. Creates tasks using layer breakdown:
   - **Backend**: Domain → Application → Infrastructure → Presentation
   - **Frontend**: Data → Business → Presentation
3. Syncs to Jira/ClickUp

## Backend Example

```
Feature: User Profile

User Stories:
- As user, I want to view my profile
- As user, I want to edit my profile
- As user, I want to upload avatar

Tasks Generated:
1. Domain Layer: UserProfile entity
2. Domain Layer: Email value object  
3. Application Layer: GetUserProfile use case
4. Application Layer: UpdateUserProfile use case
5. Infrastructure Layer: UserProfileRepository
6. Presentation Layer: GET /api/profile
7. Presentation Layer: PUT /api/profile
```

## Frontend Example

```
Feature: Product Catalog

User Stories:
- As user, I want to browse products
- As user, I want to search products

Tasks Generated:
1. Data Layer: Product types
2. Data Layer: Product API client
3. Business Layer: useProducts hook
4. Business Layer: useProductSearch hook
5. Presentation Layer: ProductCard component
6. Presentation Layer: ProductList component
7. Presentation Layer: ProductCatalog page
```

## When to Use

- Want to use agile layer breakdown guides
- Need structure by architectural layers
- Aligning with existing architecture patterns

## Related

- [Backend Layer Breakdown](mdc:modules/practices/agile-methodology/task-decomposition/backend-layer-breakdown.md)
- [Frontend Layer Breakdown](mdc:modules/practices/agile-methodology/task-decomposition/frontend-layer-breakdown.md)
- [Story Mapping](mdc:modules/practices/agile-methodology/task-decomposition/story-mapping.md)

