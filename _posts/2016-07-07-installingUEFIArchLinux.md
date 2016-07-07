---
layout: post
title: Installing UEFI Arch Linux
category: Linux
author: Phillip Chaffee
---

I have done this twice now. The first time took three days. The second time took about an hour. I figured I would share what I have learned.

This will only walk you through getting Arch Linux set up on a UEFI machine. It will not take you through creating custom users or installing a GUI. There are plenty of good Arch Linux guides for that. I am writing this because all the resources I have found on the subject have been lackluster. The only solid resource is the Arch Linux beginners guide and it can be hard to follow when you are unexperienced with Arch.

### TL;DR
Here are the steps we are going to walk through in detail.

1. Make sure you have booted in UEFI mode.
2. Connect to the internet
3. Prepare your hard drive/s
    1. Identify the device/s
    2. Partition the device/s
    3. Format the device/s
    4. Install UEFI software
    5. Mount the device/s
4. Install Arch on your hard drive/s
    1. Select your mirror
    2. Pacstrap
5. Configure your install
    1. Generate fstab
    2. Change root into install
    3. Generate locales
    4. Set time
    5. Configure the network
    6. Set root password
6. Unmount and reboot

### Detailed Steps

1. Make sure you have booted in UEFI mode.
    
    - In order to do a proper UEFI install, you have to be booted in UEFI mode. To check type the following shell command.
`ls /sys/firmware/efi/efivars`
This should return a fairly large list. If it doesn't, something is wrong. Check out your bios to make sure you are booting to UEFI mode. Most computers have an option to enable legacy BIOS boot. You will need to have that turned off.

2. Connect to the internet

    - There are two main ways to do this: wired or wireless.

        - ##### Wired
            - I just run `dhcpcd`.
        
        - ##### Wireless
            - I evenutally configure this to use auto-netctl, but wifi-menu is fine for now. `wifi-menu`

3. Prepare your hard drive/s
    1. Identify the device/s
       Run `lsblk` to identify the devices on your machine. They should be named sda, sdb, sdc, etc... You should know the approximate size of the drive you will be installing to, so identify the drive with around that amount of storage.
    2. Partition the device/s

        1. Start gdisk on the drive you will install to. `gdisk /dev/sdX` X is the letter identifier of the drive you will install to. It will start and wait for you to give it a command.
        2. Type `o` and hit enter. It will tell you that you are wiping the disk. Tell it to go for it.
        3. Type `n` to create a new partition. The first partition we are creating will be the UEFI System partition. Hit enter to accept the label of 1, then hit enter again to accept the starting memory point. It will ask you for an end memory point. Type `+512M`. This will create a partition that is 512MiB in size. Finally, it will ask for the filesystem type. The code for UEFI System partition is `ee00`. You can verify this by viewing the list of all partition types. To view the list type `L` and hit enter.
        4. Type `n` to create a new partition. The second partition will be swap. Accept the label of 2 and the starting memory point, then chose how big of a swap you want. I would reccommend either `+2G` or `+4G`. The code for a linux swap partition is `8200`.
        5. Type `n` to create a new partition. The third and final partition will be the root filesystem. Accept the label of 3, the starting memory point, and the default ending memory point. It will default to using the rest of the disk. Then hit enter to accept the default `8300` partition code for Linux Filesystem.
        6. You need to write all these changes to the disk. Type `w`, and accept writing to disk.

    3. Format the partitions
        1. Check to make sure your partitions look good. Run `lsblk` and verify all the partitions have the correct partition type.
        2. Format the UEFI System partition. Run `mkfs.fat -F32 /dev/sdX1`. This will format the partition with a FAT32 filesystem.
        3. Format the swap partition. Run `mkswap /dev/sdX2` and then `swapon /dev/sdX2`. This will create the swap filesystem and tell the system to use that as swap space.
        4. Format the root partition. Run `mkfs.ext4 /dev/sdX3`. This will create a linux filesystem on the last partition.
        
    4. Mount the device
        1. Mount the root partition. Run `mount /dev/sdX3 /mnt`. 
        2. Create and mount the /boot partition. Run `mkdir -p /mnt/boot` and then `mount /dev/sdX1 /mnt/boot`.
        
    5. Install UEFI software
    
        - There are multiple ways to do this. Some involve still using a bootloader, which I think is ridiculous. UEFI is meant to remove the need for bootloaders, so why use one? Run `efibootmgr -d /dev/sdX -p Y -c -L "Arch Linux" -l /vmlinuz-linux -u "root=/dev/sdX3 rw initrd=/initramfs-linux.img"`. Where X and Y are changed to reflect the disk and partition where the UEFI System partition is located. Change the root= parameter to reflect your Linux root (disk UUIDs can also be used). This will install the UEFI boot software directly to the /boot partition, and show it what to boot.
        
4. Install Arch on your hard drive/s
    1. Select your mirror
        1. `nano /etc/pacman.d/mirrorlist`. 
        2. Once in the file, search for a mirror url that looks good to you. 
        3. Put your cursor on the beginning of that url line, and hit Ctrl + k. This will cut that line. 
        4. Navigate to the top of the file and hit Ctrl + u. This will paste that line to the top of the file and make it the mirror you will use to download your initial Arch packages.
    2. Pacstrap
        - `pacstrap -i /mnt base base-devel`. This will install the basic packages to your new system.
5. Configure your install
    1. Generate fstab
        - `genfstab -U /mnt >> /mnt/etc/fstab`
    2. Change root into install
        - `arch-chroot /mnt /bin/bash`
    3. Generate locales
        1. `nano /etc/locale.gen`
        2. Uncomment your locale. Mine in the US is `en_US.UTF-8 UTF-8`.
        3. Type `locale-gen`. This will create the necessary system link.
        3. Type `echo LANG=en_US.UTF-8 >> /etc/locale.conf`. This creates a file that saves your locale.
    4. Set time
        1. Run `tz-select`.
        2. Create the symbolic link /etc/localtime, where Zone/Subzone is the TZ value from tzselect: `ln -s /usr/share/zoneinfo/Zone/SubZone /etc/localtime`
        3. Set the hardware clock to UTC. `hwclock --systohc --utc`.
    5. Configure the network
        - There are two main ways to do this again: wired or wireless. I would reccommend doing both of these.

            - ##### Wired
                - Run`systemctl enable dhcpcd@interface.service`.
            
            - ##### Wireless
                - Install the needed packages for wifi-menu. `pacman -S iw wpa_supplicant dialog`.
    6. Set root password
        - `passwd`
6. Unmount and reboot
   1. `umount -R /mnt`
   2. `reboot`