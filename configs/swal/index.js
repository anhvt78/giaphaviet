import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timerProgressBar: true,
  customClass: {
    container: "high-z-index",
  },
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

const sweetalert2 = {
  messageError(test, timer) {
    return Toast.fire({
      icon: "error",
      title: test,
      timer: timer ?? 3000,
      showCloseButton: true,
      customClass: {
        popup: "cw-toast cw-toast-error",
      },
    });
  },
  messageInfo(test, timer) {
    return Toast.fire({
      icon: "info",
      title: test,
      timer: timer ?? 3000,
      showCloseButton: true,
      customClass: {
        popup: "cw-toast cw-toast-info",
      },
    });
  },
  messageSuccess(test, timer) {
    return Toast.fire({
      icon: "success",
      title: test,
      timer: timer ?? 3000,
      showCloseButton: true,
      customClass: {
        popup: "cw-toast cw-toast-success",
      },
    });
  },
  async popupAlert(params) {
    return await Swal.fire({
      title: params.title,
      text: params.text,
      icon: params.icon ? params.icon : "warning",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "OK",
      allowOutsideClick: false,
    });
  },
  async popupError(params) {
    return await Swal.fire({
      title: params.title,
      text: params.text,
      icon: params.icon ? params.icon : "error",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "OK",
      allowOutsideClick: false,
    });
  },
  async confirm(params) {
    let popup = await Swal.fire({
      title: params.title,
      text: params.text,
      icon: params.icon ? params.icon : "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: params.buttonConfirm,
    }).then((result) => {
      return new Promise((resolve) => {
        if (result.isConfirmed) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });

    return popup;
  },
};

export default sweetalert2;
