# Marka Software Development Process Standards

## Project Management and Collaboration

## Development

## Testing

## Deployment

### Cloud Providers

Being a Gold Microsoft Partner along with Azure's powerful capabilities any possible purpose and scale, defines Microsoft Azure as the prefferable cloud to host resources, setup CI/CD pipelines, deploy solutions.
Amazon Web Services (AWS) and Google Cloud Platform (GCP), are also available options to obtian crucail professional skills for Marka's develpers.

### Docker

#### General Recommendations

- use multi-stage builds
- preffer alpine base images where possible
- keep image size as small as possible
- minimaze the number of layers combining commands with '&&'
- add and use .dockerignore files

#### Optimizations

For analyzing and optimizing images, use tools like:

- Dive (https://github.com/wagoodman/dive)
- Slim (https://github.com/slimtoolkit/slim?tab=readme-ov-file)
