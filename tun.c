#include <fcntl.h>
#include <linux/if.h>
#include <linux/if_tun.h>
#include <string.h>
#include <sys/ioctl.h>
#include <unistd.h>

int tun_open(const char *ifname) {
  int fd = open("/dev/net/tun", O_RDWR | 04000); // 04000 is O_NONBLOCK on Linux
  if (fd < 0) {
    return -1;
  }

  struct ifreq ifr;
  memset(&ifr, 0, sizeof(ifr));
  ifr.ifr_flags = IFF_TUN | IFF_NO_PI;
  strncpy(ifr.ifr_name, ifname, IFNAMSIZ - 1);

  if (ioctl(fd, TUNSETIFF, &ifr) < 0) {
    close(fd);
    return -1;
  }
  return fd;
}

int tun_read(int fd, void *buf, int len) { return read(fd, buf, len); }

int tun_write(int fd, const void *buf, int len) { return write(fd, buf, len); }