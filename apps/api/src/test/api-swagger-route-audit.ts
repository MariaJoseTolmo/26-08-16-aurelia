import 'reflect-metadata';
import { RequestMethod, type Type } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import '../modules/auth/auth-openapi.metadata';
import { AuthModule } from '../modules/auth/auth.module';
import '../modules/inspections/inspection-openapi.metadata';
import '../modules/inspections/inspection-openapi.responses';
import '../modules/inspections/inspection-openapi-secondary.responses';
import { InspectionsModule } from '../modules/inspections/inspections.module';

const CONTROLLERS_METADATA = 'controllers';
const SWAGGER_OPERATION_METADATA = 'swagger/apiOperation';

type ControllerType = Type<unknown>;

interface RouteDescriptor {
  controller: string;
  handler: string;
  method: string;
  path: string;
  registrationIndex: number;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function asPaths(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === 'string') return [value];
  if (value === undefined || value === null) return [''];
  return [String(value)];
}

function normalizePath(...parts: string[]): string {
  const segments = parts
    .flatMap((part) => part.split('/'))
    .map((segment) => segment.trim())
    .filter(Boolean);
  return `/${segments.join('/')}`;
}

function pathSegments(path: string): string[] {
  return path.split('/').filter(Boolean);
}

function isDynamicSegment(segment: string): boolean {
  return segment.startsWith(':') || segment === '*' || segment.includes('(.*)');
}

function isFullyStaticPath(path: string): boolean {
  return pathSegments(path).every((segment) => !isDynamicSegment(segment));
}

function patternMatchesStaticPath(pattern: string, staticPath: string): boolean {
  const patternSegments = pathSegments(pattern);
  const staticSegments = pathSegments(staticPath);
  if (patternSegments.length !== staticSegments.length) return false;

  return patternSegments.every((segment, index) => (
    isDynamicSegment(segment) || segment === staticSegments[index]
  ));
}

function requestMethodName(method: RequestMethod): string {
  const name = RequestMethod[method];
  return typeof name === 'string' ? name : String(method);
}

function moduleControllers(moduleType: Type<unknown>): ControllerType[] {
  const controllers = Reflect.getMetadata(CONTROLLERS_METADATA, moduleType) as unknown;
  assert(Array.isArray(controllers), `${moduleType.name} must expose controller metadata`);
  return controllers as ControllerType[];
}

function controllerRoutes(controller: ControllerType, startIndex: number): RouteDescriptor[] {
  const controllerPaths = asPaths(Reflect.getMetadata(PATH_METADATA, controller));
  const prototype = controller.prototype as Record<string, unknown>;
  const routes: RouteDescriptor[] = [];

  Object.getOwnPropertyNames(prototype)
    .filter((methodName) => methodName !== 'constructor')
    .forEach((methodName) => {
      const handler = prototype[methodName];
      if (typeof handler !== 'function') return;

      const requestMethod = Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod | undefined;
      if (requestMethod === undefined) return;

      const operation = Reflect.getMetadata(SWAGGER_OPERATION_METADATA, handler) as {
        summary?: unknown;
      } | undefined;
      assert(operation, `${controller.name}.${methodName} is missing ApiOperation metadata`);
      assert(
        typeof operation.summary === 'string' && operation.summary.trim().length > 0,
        `${controller.name}.${methodName} must define a non-empty Swagger summary`,
      );

      const handlerPaths = asPaths(Reflect.getMetadata(PATH_METADATA, handler));
      controllerPaths.forEach((controllerPath) => {
        handlerPaths.forEach((handlerPath) => {
          routes.push({
            controller: controller.name,
            handler: methodName,
            method: requestMethodName(requestMethod),
            path: normalizePath(controllerPath, handlerPath),
            registrationIndex: startIndex + routes.length,
          });
        });
      });
    });

  return routes;
}

function assertNoDuplicateRoutes(routes: RouteDescriptor[]): void {
  const registered = new Map<string, RouteDescriptor>();

  routes.forEach((route) => {
    const key = `${route.method} ${route.path}`;
    const previous = registered.get(key);
    assert(
      !previous,
      `Duplicate route ${key}: ${previous?.controller}.${previous?.handler} and ${route.controller}.${route.handler}`,
    );
    registered.set(key, route);
  });
}

function assertNoDynamicRouteShadowsStaticRoute(routes: RouteDescriptor[]): void {
  routes.forEach((laterRoute, laterIndex) => {
    if (!isFullyStaticPath(laterRoute.path)) return;

    routes.slice(0, laterIndex).forEach((earlierRoute) => {
      if (earlierRoute.method !== laterRoute.method) return;
      if (isFullyStaticPath(earlierRoute.path)) return;
      if (!patternMatchesStaticPath(earlierRoute.path, laterRoute.path)) return;

      throw new Error(
        `${earlierRoute.method} ${earlierRoute.path} (${earlierRoute.controller}.${earlierRoute.handler}) `
        + `shadows static route ${laterRoute.path} (${laterRoute.controller}.${laterRoute.handler})`,
      );
    });
  });
}

function main(): void {
  const controllers = [
    ...moduleControllers(AuthModule),
    ...moduleControllers(InspectionsModule),
  ];

  const routes = controllers.flatMap((controller, controllerIndex) => (
    controllerRoutes(controller, controllerIndex * 1_000)
  ));

  assert(routes.length > 0, 'Swagger route audit must discover at least one operation');
  assertNoDuplicateRoutes(routes);
  assertNoDynamicRouteShadowsStaticRoute(routes);

  console.log(
    `Swagger route audit passed: ${routes.length} operations across ${controllers.length} controllers`,
  );
}

main();
