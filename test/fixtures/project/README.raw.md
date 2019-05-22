# Dummy project

As an example, will demonstrate the functionality of the pleasure framework in the scenario of an online store.

- [Configuration](#dummy-project-configuration)
- [Entities & Access](#dummy-project-entities--access)

### Dummy Project Configuration

@show-source(pleasure.config.js)

### Dummy Project Entities & Access

To start, we will create the DB structure of our online store. To do so, we are gonna set entities for:
user, product and order, by creating their corresponding files and exporting a [PleasureEntity](#pleasure-entity).

@show-source(api/user.js)

@show-source(api/product.js)

@show-source(api/order.js)
