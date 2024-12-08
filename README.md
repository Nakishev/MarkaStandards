![alt text](Assets/logo.png)

- [Software Development Process Standards](#software-development-process-standards)
  - [Project Management and Collaboration](#project-management-and-collaboration)
  - [Development](#development)
  - [Testing](#testing)
  - [Deployment](#deployment)
    - [Cloud Providers](#cloud-providers)
    - [Docker](#docker)
      - [General Recommendations](#general-recommendations)
      - [Optimizations](#optimizations)
- [Official Resources](#official-resources)

# Software Development Process Standards

## Project Management and Collaboration

## Development

## Testing

## Deployment

### Cloud Providers

Being a Gold Microsoft Partner along with Azure's powerful capabilities any possible purpose and scale, defines Microsoft Azure as the preferable cloud to host resources, setup CI/CD pipelines, deploy solutions.
Amazon Web Services (AWS) and Google Cloud Platform (GCP), are also available options to obtain crucial professional skills for Marka's developers.

### Docker

#### General Recommendations

- use multi-stage builds
- prefer alpine base images where possible
- keep image size as small as possible
- minimize the number of layers combining commands with '&&'
- add and use .dockerignore files

#### Optimizations

For analyzing and optimizing images, use tools like:

- Dive (https://github.com/wagoodman/dive)
- Slim (https://github.com/slimtoolkit/slim?tab=readme-ov-file)

# Official Resources

A list of the Marka's resources

- official public site (https://marka-development.com/)
- corporate Staff Management System (https://wa-staffmanagement-linux-prod.azurewebsites.net)
