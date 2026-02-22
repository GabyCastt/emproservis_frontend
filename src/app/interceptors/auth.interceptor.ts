import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Sin autenticación - pasar la petición sin modificar
  return next(req);
};
