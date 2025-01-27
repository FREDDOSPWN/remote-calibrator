import { colorIconOrange } from '../constants'

export const swalInfoOptions = {
  icon: 'info',
  allowEscapeKey: false,
  allowEnterKey: false,
  allowOutsideClick: false,
  showConfirmButton: true,
  confirmButtonText: 'OK',
  showClass: {
    popup: 'animate__animated animate__fadeInUp',
    // backdrop: 'animate__animated animate__fadeIn',
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutDown',
    // backdrop: 'animate__animated animate__fadeOut',
  },
  iconColor: colorIconOrange,
  confirmButtonColor: '#aaa',
  customClass: {
    icon: 'my__swal2__icon',
    title: 'my__swal2__title',
    htmlContainer: 'my__swal2__html',
  },
}
