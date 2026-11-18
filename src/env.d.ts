/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** True when the request carries a valid admin session. */
    isAdmin: boolean;
  }
}
